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
  REFLECTION_INSTRUCTIONS,
  WEEK_INSTRUCTIONS,
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
        entryIds: z.array(z.string()),
      }),
    )
    .min(1)
    .max(8),
});
type WeekOutput = z.infer<typeof WeekOutputSchema>;

const clip = (text: string, max: number) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
};

/**
 * Fits model output to the WeekTheme contract: known entry ids only, length
 * limits, at most 5 themes. Pure, for tests.
 */
export function normalizeThemes(
  output: WeekOutput,
  entries: Entry[],
): WeekTheme[] {
  const known = new Set(entries.map((e) => e.id));
  return output.themes
    .map((theme) => ({
      title: clip(theme.title, 60),
      text: clip(theme.text, 240),
      entryIds: [...new Set(theme.entryIds.map((id) => id.trim()))]
        .filter((id) => known.has(id))
        .slice(0, 5),
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
      maxOutputTokens: 400,
      temperature: 0.7,
      maxRetries: 1,
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
      maxOutputTokens: 1200,
      temperature: 0.4,
      maxRetries: 1,
      timeout: 60_000,
    });
    const themes = normalizeThemes(output, entries);
    if (themes.length === 0) throw new Error("The model returned no themes");
    return themes;
  }
}
