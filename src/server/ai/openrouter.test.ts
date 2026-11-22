import { APICallError, RetryError, simulateReadableStream } from "ai";
import { MockEmbeddingModelV4, MockLanguageModelV4 } from "ai/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Entry } from "@/contracts/journal";

const mocks = vi.hoisted(() => ({
  chat: undefined as unknown,
  embedding: undefined as unknown,
}));

vi.mock("@/env", () => ({
  env: {
    OPENROUTER_API_KEY: "test-key",
    OPENROUTER_CHAT_MODEL: "test/chat",
    OPENROUTER_EMBEDDING_MODEL: "test/embed",
  },
}));
vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: () => ({
    chat: () => mocks.chat,
    textEmbeddingModel: () => mocks.embedding,
  }),
}));

const { embedText, normalizeThemes, OpenRouterAiClient } =
  await import("./openrouter");
const { isModelBusyError } = await import("./errors");

const usage = {
  inputTokens: {
    total: 3,
    noCache: 3,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

const entry = (
  id: string,
  text = "Called Dad.",
  createdAt = "2026-11-22T10:00:00Z",
): Entry => ({
  id,
  userId: "u1",
  text,
  mood: "okay",
  createdAt,
  updatedAt: createdAt,
});

const rateLimited = () =>
  new APICallError({
    message: "Rate limit exceeded: free-models-per-min",
    url: "https://openrouter.ai/api/v1/chat/completions",
    requestBodyValues: {},
    statusCode: 429,
    isRetryable: true,
  });

async function collect(stream: AsyncIterable<string>) {
  const chunks: string[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
}

describe("OpenRouterAiClient", () => {
  beforeEach(() => {
    mocks.chat = undefined;
    mocks.embedding = undefined;
  });

  it("streams text deltas with Echo's instructions and prompt", async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t" },
            { type: "text-delta", id: "t", delta: "A quiet " },
            { type: "text-delta", id: "t", delta: "week." },
            { type: "text-end", id: "t" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: undefined },
              usage,
            },
          ],
        }),
      }),
    });
    mocks.chat = model;

    const chunks = await collect(
      new OpenRouterAiClient().streamReflection({
        entry: entry("t"),
        recalled: [],
      }),
    );
    expect(chunks.join("")).toBe("A quiet week.");
    const prompt = JSON.stringify(model.doStreamCalls[0]?.prompt);
    expect(prompt).toContain("You are Echo");
    expect(prompt).toContain("Called Dad.");
    expect(model.doStreamCalls[0]?.maxOutputTokens).toBe(250);
  });

  it("surfaces a 429 from the provider as a busy error", async () => {
    mocks.chat = new MockLanguageModelV4({
      doStream: async () => {
        throw rateLimited();
      },
    });
    const error: unknown = await collect(
      new OpenRouterAiClient().streamReflection({
        entry: entry("t"),
        recalled: [],
      }),
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(isModelBusyError(error)).toBe(true);
  });

  it("throws when the provider reports an error mid-stream", async () => {
    mocks.chat = new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t" },
            { type: "text-delta", id: "t", delta: "Half" },
            { type: "error", error: new Error("upstream down") },
          ],
        }),
      }),
    });
    await expect(
      collect(
        new OpenRouterAiClient().streamReflection({
          entry: entry("t"),
          recalled: [],
        }),
      ),
    ).rejects.toThrow("upstream down");
  });

  it("summarises a week into contract-sized themes", async () => {
    const themes = {
      themes: [
        { title: "Family", text: "Your dad came up a lot.", entries: [1] },
        { title: "Work", text: "The new job.", entries: [2, 9] },
      ],
    };
    const model = new MockLanguageModelV4({
      doGenerate: async () => ({
        content: [{ type: "text", text: JSON.stringify(themes) }],
        finishReason: { unified: "stop", raw: undefined },
        usage,
        warnings: [],
      }),
    });
    mocks.chat = model;
    const result = await new OpenRouterAiClient().summarizeWeek([
      entry("b", "Started the job.", "2026-11-20T10:00:00Z"),
      entry("a", "Called Dad.", "2026-11-18T10:00:00Z"),
    ]);
    expect(model.doGenerateCalls[0]?.maxOutputTokens).toBe(400);
    const prompt = JSON.stringify(model.doGenerateCalls[0]?.prompt);
    expect(prompt).toContain('#1 Nov 18, okay: \\"Called Dad.\\"');
    expect(prompt).not.toContain("id:");
    expect(result).toEqual([
      { title: "Family", text: "Your dad came up a lot.", entryIds: ["a"] },
      { title: "Work", text: "The new job.", entryIds: ["b"] },
    ]);
  });

  it("embeds text and checks the vector size", async () => {
    mocks.embedding = new MockEmbeddingModelV4({
      doEmbed: async () => ({
        embeddings: [Array.from({ length: 1536 }, () => 0.1)],
        warnings: [],
      }),
    });
    expect(await embedText("hello")).toHaveLength(1536);

    mocks.embedding = new MockEmbeddingModelV4({
      doEmbed: async () => ({ embeddings: [[0.1, 0.2]], warnings: [] }),
    });
    await expect(embedText("hello")).rejects.toThrow("1536-dim");
  });
});

describe("normalizeThemes", () => {
  it("maps entry numbers to ids, clips, drops unknown and empty, keeps 5", () => {
    const result = normalizeThemes(
      {
        themes: [
          {
            title: "x".repeat(80),
            text: "y".repeat(300),
            entries: [1, 1, 0, 1.5],
          },
          { title: " ", text: "No title", entries: [] },
          ...Array.from({ length: 6 }, (_, i) => ({
            title: `T${i}`,
            text: "t",
            entries: [7],
          })),
        ],
      },
      [entry("a")],
    );
    expect(result).toHaveLength(5);
    expect(result[0]?.title).toHaveLength(60);
    expect(result[0]?.text).toHaveLength(240);
    expect(result[0]?.entryIds).toEqual(["a"]);
    expect(result[1]).toEqual({ title: "T0", text: "t", entryIds: [] });
  });
});

describe("isModelBusyError", () => {
  it("spots rate limits and overload through AI SDK wrappers", () => {
    expect(isModelBusyError(rateLimited())).toBe(true);
    expect(
      isModelBusyError(
        new RetryError({
          message: "Failed after 2 attempts",
          reason: "maxRetriesExceeded",
          errors: [rateLimited()],
        }),
      ),
    ).toBe(true);
    expect(isModelBusyError({ data: { error: { code: 503 } } })).toBe(true);
    expect(isModelBusyError(new Error("Provider is overloaded"))).toBe(true);
  });

  it("leaves other failures alone", () => {
    expect(isModelBusyError(new Error("Invalid API key"))).toBe(false);
    expect(isModelBusyError({ statusCode: 401 })).toBe(false);
    expect(isModelBusyError(null)).toBe(false);
  });
});
