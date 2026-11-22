import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  REFLECT_RECALLED_HEADER,
  REFLECT_STATUS_HEADER,
} from "@/contracts/api";
import type { AiClient, Backend } from "@/contracts/backend";
import { RecalledRefSchema } from "@/contracts/journal";
import { DEMO_USER_ID, type Session } from "@/contracts/session";
import { FakeAiClient, fakeReflectionText } from "@/server/ai/fake";
import { resetDemoStoreForTests } from "@/server/demo/store";
import { MemoryEntriesRepo } from "@/server/entries/memory";
import { MemoryMemoryStore } from "@/server/memory/memory";
import { MemoryReflectionsRepo } from "@/server/reflections/memory";
import { MemoryUsageLimiter } from "@/server/usage/memory";

const state = vi.hoisted(() => ({
  backend: undefined as unknown,
  session: null as unknown,
  pending: [] as Promise<unknown>[],
}));

vi.mock("@/server/backend", () => ({ getBackend: () => state.backend }));
vi.mock("next/server", () => ({
  after: (task: () => Promise<unknown>) => {
    state.pending.push(task());
  },
}));

const { POST } = await import("./route");

const DEMO: Session = { userId: DEMO_USER_ID, email: null, isDemo: true };

function makeBackend(options: { limit?: number; ai?: AiClient } = {}) {
  const ai = options.ai ?? new FakeAiClient(0);
  const backend = {
    auth: { getSession: async () => state.session as Session | null },
    entries: new MemoryEntriesRepo(),
    reflections: new MemoryReflectionsRepo(),
    memory: new MemoryMemoryStore(),
    usage: new MemoryUsageLimiter(options.limit ?? 10),
    ai,
  };
  state.backend = backend as unknown as Backend;
  return backend;
}

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/reflect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

function recalledOf(response: Response) {
  const raw = response.headers.get(REFLECT_RECALLED_HEADER) ?? "";
  return RecalledRefSchema.array().parse(
    JSON.parse(decodeURIComponent(raw)) as unknown,
  );
}

describe("POST /api/reflect", () => {
  beforeEach(() => {
    resetDemoStoreForTests();
    state.session = DEMO;
    state.pending = [];
  });

  it("streams a reply grounded in older entries and saves it", async () => {
    const backend = makeBackend();
    const stream = vi.spyOn(backend.ai, "streamReflection");
    const entry = await backend.entries.create(DEMO_USER_ID, {
      text: "Called Dad about the move. We talked it through.",
      mood: "good",
    });

    const response = await post({ entryId: entry.id });
    expect(response.status).toBe(200);
    expect(response.headers.get(REFLECT_STATUS_HEADER)).toBe("streaming");
    const recalled = recalledOf(response);
    expect(recalled.length).toBeGreaterThanOrEqual(1);
    expect(recalled.length).toBeLessThanOrEqual(3);
    expect(recalled[0]?.quote).toMatch(/Dad/);

    const text = await response.text();
    await Promise.all(state.pending);
    expect(stream).toHaveBeenCalledOnce();
    const request = stream.mock.calls[0]?.[0];
    expect(request && text).toBe(request && fakeReflectionText(request));

    const saved = await backend.reflections.get(DEMO_USER_ID, entry.id);
    expect(saved).toMatchObject({ status: "done", text, recalled });
    expect(await backend.usage.remaining(DEMO_USER_ID)).toBe(9);
  });

  it("returns an existing reply without a model call or quota", async () => {
    const backend = makeBackend();
    const stream = vi.spyOn(backend.ai, "streamReflection");
    const existing = await backend.reflections.get(DEMO_USER_ID, "demo-e01");

    const response = await post({ entryId: "demo-e01" });
    expect(response.headers.get(REFLECT_STATUS_HEADER)).toBe("done");
    expect(await response.text()).toBe(existing?.text);
    expect(recalledOf(response)).toEqual(existing?.recalled);
    expect(stream).not.toHaveBeenCalled();
    expect(await backend.usage.remaining(DEMO_USER_ID)).toBe(10);
  });

  it("regenerates an existing reply when asked", async () => {
    const backend = makeBackend();
    const response = await post({ entryId: "demo-e01", regenerate: true });
    expect(response.headers.get(REFLECT_STATUS_HEADER)).toBe("streaming");
    const text = await response.text();
    await Promise.all(state.pending);
    const saved = await backend.reflections.get(DEMO_USER_ID, "demo-e01");
    expect(saved?.text).toBe(text);
    expect(await backend.usage.remaining(DEMO_USER_ID)).toBe(9);
  });

  it("answers a first entry without memory", async () => {
    state.session = { userId: "new-user", email: null, isDemo: false };
    const backend = makeBackend();
    const entry = await backend.entries.create("new-user", {
      text: "My first entry.",
      mood: "okay",
    });
    const response = await post({ entryId: entry.id });
    expect(recalledOf(response)).toEqual([]);
    expect(await response.text()).toContain("Thank you");
  });

  it("shows the crisis card: no model call, no quota, entry kept", async () => {
    const backend = makeBackend();
    const stream = vi.spyOn(backend.ai, "streamReflection");
    const entry = await backend.entries.create(DEMO_USER_ID, {
      text: "I don't want to live anymore.",
      mood: "rough",
    });

    const response = await post({ entryId: entry.id });
    expect(response.headers.get(REFLECT_STATUS_HEADER)).toBe("crisis");
    expect(await response.text()).toBe("");
    expect(stream).not.toHaveBeenCalled();
    expect(await backend.usage.remaining(DEMO_USER_ID)).toBe(10);
    expect(await backend.entries.get(DEMO_USER_ID, entry.id)).not.toBeNull();
    expect(
      (await backend.reflections.get(DEMO_USER_ID, entry.id))?.status,
    ).toBe("crisis");

    // Asking again returns the saved crisis state.
    const again = await post({ entryId: entry.id });
    expect(again.headers.get(REFLECT_STATUS_HEADER)).toBe("crisis");
  });

  it("stops at the daily limit without a model call", async () => {
    const backend = makeBackend({ limit: 1 });
    const stream = vi.spyOn(backend.ai, "streamReflection");
    await backend.usage.consume(DEMO_USER_ID);
    const entry = await backend.entries.create(DEMO_USER_ID, {
      text: "Quiet evening.",
      mood: "okay",
    });

    const response = await post({ entryId: entry.id });
    expect(response.headers.get(REFLECT_STATUS_HEADER)).toBe("limit");
    expect(await response.text()).toBe(
      "You've used today's 1 reply. Echo will be back tomorrow.",
    );
    expect(stream).not.toHaveBeenCalled();
    expect(
      (await backend.reflections.get(DEMO_USER_ID, entry.id))?.status,
    ).toBe("limit");
  });

  it("keeps the entry and records an error when the model fails", async () => {
    const failing: AiClient = {
      async *streamReflection() {
        throw new Error("model down");
      },
      summarizeWeek: async () => [],
    };
    const backend = makeBackend({ ai: failing });
    const entry = await backend.entries.create(DEMO_USER_ID, {
      text: "A normal day.",
      mood: "okay",
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await post({ entryId: entry.id });
    expect(response.status).toBe(502);
    expect(await backend.entries.get(DEMO_USER_ID, entry.id)).not.toBeNull();
    expect(
      (await backend.reflections.get(DEMO_USER_ID, entry.id))?.status,
    ).toBe("error");

    // A failed regenerate keeps the previous reply.
    const before = await backend.reflections.get(DEMO_USER_ID, "demo-e01");
    const regenerate = await post({ entryId: "demo-e01", regenerate: true });
    expect(regenerate.status).toBe(502);
    expect(await backend.reflections.get(DEMO_USER_ID, "demo-e01")).toEqual(
      before,
    );
  });

  it("errors the stream when the model fails mid-reply", async () => {
    const flaky: AiClient = {
      async *streamReflection() {
        yield "Thank you ";
        throw new Error("connection reset");
      },
      summarizeWeek: async () => [],
    };
    const backend = makeBackend({ ai: flaky });
    const entry = await backend.entries.create(DEMO_USER_ID, {
      text: "Another day.",
      mood: "okay",
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await post({ entryId: entry.id });
    expect(response.headers.get(REFLECT_STATUS_HEADER)).toBe("streaming");
    await expect(response.text()).rejects.toThrow();
    await Promise.all(state.pending);
    expect(
      (await backend.reflections.get(DEMO_USER_ID, entry.id))?.status,
    ).toBe("error");
  });

  it("rejects bad requests", async () => {
    makeBackend();
    expect((await post({ nope: true })).status).toBe(400);
    expect((await post({ entryId: "missing" })).status).toBe(404);
    state.session = null;
    expect((await post({ entryId: "demo-e01" })).status).toBe(401);
  });
});
