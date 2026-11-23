import "server-only";

/**
 * Replies being generated right now, keyed `userId:entryId`. A reload or a
 * second tab must not start another model call (and use more quota) while
 * the first one is still running. Per server instance: good enough to stop
 * the common double request, not a distributed lock.
 */
export class InFlightReplies {
  private readonly keys = new Set<string>();

  /** Marks the reply as generating: the release function, or null if it already is. */
  tryAcquire(userId: string, entryId: string): (() => void) | null {
    const key = `${userId}:${entryId}`;
    if (this.keys.has(key)) return null;
    this.keys.add(key);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.keys.delete(key);
    };
  }

  isGenerating(userId: string, entryId: string): boolean {
    return this.keys.has(`${userId}:${entryId}`);
  }
}

const globalForReplies = globalThis as unknown as {
  __echoInFlightReplies?: InFlightReplies;
};

/** The process-wide registry (survives dev reloads like the demo store). */
export function getInFlightReplies(): InFlightReplies {
  globalForReplies.__echoInFlightReplies ??= new InFlightReplies();
  return globalForReplies.__echoInFlightReplies;
}
