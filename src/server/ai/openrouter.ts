import "server-only";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { embed, generateText, Output, streamText } from "ai";
import * as z from "zod";

import type { AiClient, ReflectionRequest } from "@/contracts/backend";
import type { Entry, WeekTheme } from "@/contracts/journal";
import { env } from "@/env";

import {
  buildReflectionPrompt,
  buildWeekPrompt,
  clip,
  REFLECTION_INSTRUCTIONS,
  WEEK_INSTRUCTIONS,
  weekPromptOrder,
} from "./prompts";

/** `vector(1536)` in supabase/migrations/0001_init.sql. */
export const EMBEDDING_DIMENSIONS = 1536;

let provider: ReturnType<typeof createOpenRouter> | undefined;

function openRouter() {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
  provider ??= createOpenRouter({ apiKey });
  return provider;
}

/** Embeds a text for memory search (OpenRouter embeddings, 1536 dims). */
export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openRouter().textEmbeddingModel(env.OPENROUTER_EMBEDDING_MODEL),
    value: text,
    maxRetries: 1,
  });
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected a ${EMBEDDING_DIMENSIONS}-dim embedding, got ${embedding.length}`,
    );
  }
  return embedding;
}

/** What the model returns for a week; trimmed to WeekTheme by normalizeThemes. */
const WeekOutputSchema = z.object({
  themes: z
    .array(
      z.object({
        title: z.string(),
        text: z.string(),
        /** `#n` numbers from the week prompt, not ids (fewer tokens). */
        entries: z.array(z.number()),
      }),
    )
    .min(1)
    .max(8),
});
type WeekOutput = z.infer<typeof WeekOutputSchema>;

const oneLine = (text: string) => text.replace(/\s+/g, " ");

/**
 * Fits model output to the WeekTheme contract: entry numbers mapped back to
 * ids (unknown ones dropped), length limits, at most 5 themes. Pure, for tests.
 */
export function normalizeThemes(
  output: WeekOutput,
  entries: Entry[],
): WeekTheme[] {
  const ordered = weekPromptOrder(entries);
  return output.themes
    .map((theme) => ({
      title: clip(oneLine(theme.title), 60),
      text: clip(oneLine(theme.text), 240),
      entryIds: [
        ...new Set(
          theme.entries.flatMap((n) => {
            const entry = Number.isInteger(n) ? ordered[n - 1] : undefined;
            return entry ? [entry.id] : [];
          }),
        ),
      ].slice(0, 5),
    }))
    .filter((theme) => theme.title && theme.text)
    .slice(0, 5);
}

/** Real-mode AI on OpenRouter through the AI SDK. */
export class OpenRouterAiClient implements AiClient {
  async *streamReflection(request: ReflectionRequest): AsyncIterable<string> {
    const result = streamText({
      model: openRouter().chat(env.OPENROUTER_CHAT_MODEL),
      instructions: REFLECTION_INSTRUCTIONS,
      prompt: buildReflectionPrompt(request),
      // ≤ 120 words ≈ 160 tokens; the cap keeps a rambling model cheap.
      maxOutputTokens: 250,
      temperature: 0.7,
      // Retrying a rate-limited `:free` model only burns another request:
      // the route reports "busy" and the user tries again.
      maxRetries: 0,
      timeout: { totalMs: 60_000, firstChunkMs: 20_000 },
    });
    // `textStream` hides errors; the full stream surfaces them so the route
    // can show the error state instead of a half reply.
    for await (const part of result.stream) {
      if (part.type === "text-delta") yield part.text;
      else if (part.type === "error") throw part.error;
    }
  }

  async summarizeWeek(entries: Entry[]): Promise<WeekTheme[]> {
    const { output } = await generateText({
      model: openRouter().chat(env.OPENROUTER_CHAT_MODEL),
      instructions: WEEK_INSTRUCTIONS,
      prompt: buildWeekPrompt(entries),
      output: Output.object({ schema: WeekOutputSchema }),
      maxOutputTokens: 400,
      temperature: 0.4,
      maxRetries: 0,
      timeout: 60_000,
    });
    const themes = normalizeThemes(output, entries);
    if (themes.length === 0) throw new Error("The model returned no themes");
    return themes;
  }
}
