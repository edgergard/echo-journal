"use client";

import { useRouter } from "next/navigation";

import { createEntryAction } from "@/app/(app)/journal/actions";
import { routes } from "@/lib/routes";

import { EntryEditor } from "./entry-editor";

/** Wires the editor to the create action; a saved entry opens with ?saved=1. */
export function NewEntryForm() {
  const router = useRouter();
  return (
    <EntryEditor
      submitLabel="Save entry"
      note="Echo replies after you save. Not a therapist."
      confirmDiscard
      autoFocus
      onCancel={() => router.push(routes.journal)}
      onSubmit={async (input) => {
        const result = await createEntryAction(input);
        if (!result.ok) return result;
        router.push(`${routes.entry(result.entry.id)}?saved=1`);
        return { ok: true };
      }}
    />
  );
}
