// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getBackend } from "@/server/backend";

const userId = `u-${crypto.randomUUID()}`;

vi.mock("@/server/auth/require-session", () => ({
  requireSession: async () => ({ userId, email: null, isDemo: false }),
}));

import {
  createEntryAction,
  deleteEntryAction,
  loadOlderEntriesAction,
  updateEntryAction,
} from "./actions";

describe("journal server actions (demo backend)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates, edits and deletes an entry for the session user", async () => {
    const created = await createEntryAction({ text: "Hello", mood: "good" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.entry.userId).toBe(userId);

    const edited = await updateEntryAction(created.entry.id, {
      text: "Hello again",
      mood: "okay",
    });
    expect(edited.ok && edited.entry.text).toBe("Hello again");

    const older = await loadOlderEntriesAction(
      new Date(Date.now() + 60_000).toISOString(),
    );
    expect(older?.entries.map((e) => e.id)).toContain(created.entry.id);

    expect(await deleteEntryAction(created.entry.id)).toEqual({ ok: true });
    expect(await getBackend().entries.get(userId, created.entry.id)).toBeNull();
    expect(await deleteEntryAction(created.entry.id)).toEqual({ ok: false });
  });

  it("returns a validation error for bad input", async () => {
    const result = await createEntryAction({ text: "", mood: "good" });
    expect(result).toEqual({ ok: false, error: "Write something first." });
  });
});
