import "server-only";

import type { AiClient } from "@/contracts/backend";
import type { WeekTheme } from "@/contracts/journal";

const TODO = "OpenRouter AI client is not implemented yet (stream 1-ai)";

/** Real-mode AI on OpenRouter (AI SDK). Stub — implemented by stream 1-ai. */
export class OpenRouterAiClient implements AiClient {
  async *streamReflection(): AsyncIterable<string> {
    throw new Error(TODO);
  }
  async summarizeWeek(): Promise<WeekTheme[]> {
    throw new Error(TODO);
  }
}
