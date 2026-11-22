import "server-only";

import type { AiClient, ReflectionRequest } from "@/contracts/backend";
import type { Entry, WeekTheme } from "@/contracts/journal";

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** Builds the canned demo reply for an entry. Pure, for tests. */
export function fakeReflectionText(request: ReflectionRequest): string {
  const first = request.recalled[0];
  const memory = first
    ? ` On ${shortDate(first.ref.date)} you wrote “${first.ref.quote}” — it seems connected to what you’re carrying today.`
    : "";
  return `Thank you for putting this into words.${memory} What feels most important to hold onto from today?`;
}

/** Demo-mode AI: streams a canned reply word by word, no network. */
export class FakeAiClient implements AiClient {
  constructor(private readonly delayMs = 25) {}

  async *streamReflection(request: ReflectionRequest): AsyncIterable<string> {
    const words = fakeReflectionText(request).split(/(?<= )/);
    for (const word of words) {
      if (this.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.delayMs));
      }
      yield word;
    }
  }

  async summarizeWeek(entries: Entry[]): Promise<WeekTheme[]> {
    const ids = entries.map((e) => e.id);
    return [
      {
        title: "What filled the week",
        text: `You wrote ${entries.length} entries this week. The moments you came back to most are linked below.`,
        entryIds: ids.slice(0, 3),
      },
      {
        title: "Small good things",
        text: "Walks, calls and quiet evenings showed up as the brighter moments.",
        entryIds: ids.slice(3, 5),
      },
    ];
  }
}
