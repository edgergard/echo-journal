"use client";

import type { Reflection } from "@/contracts/journal";

/** Props are a contract: stream 1-entries renders this on the entry page. */
export interface ReflectionPanelProps {
  entryId: string;
  initialReflection: Reflection | null;
  /** The entry was just created — request a reply and announce "Entry saved". */
  justSaved?: boolean;
  /** The entry was edited — offer "Regenerate reply". */
  edited?: boolean;
}

/** Stub — stream 1-ai builds it (design.md: entry → ReflectionPanel). */
export function ReflectionPanel({ initialReflection }: ReflectionPanelProps) {
  return (
    <section aria-labelledby="echo-heading" className="flex flex-col gap-3">
      <h2
        id="echo-heading"
        className="text-sm font-semibold text-muted-foreground"
      >
        Echo
      </h2>
      <p className="max-w-[68ch] font-serif text-lg leading-relaxed">
        {initialReflection?.text ?? "Echo’s reply will appear here."}
      </p>
    </section>
  );
}
