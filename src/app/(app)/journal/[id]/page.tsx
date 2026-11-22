import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ReflectionPanel } from "@/components/reflection/reflection-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";
import { getBackend } from "@/server/backend";

/** Stub — stream 1-entries builds it (design.md: entry). */
async function EntryView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(routes.entry(id));
  const backend = getBackend();
  const entry = await backend.entries.get(session.userId, id);
  if (!entry) notFound();
  const reflection = await backend.reflections.get(session.userId, entry.id);
  return (
    <article className="flex flex-col gap-10">
      <p className="max-w-[68ch] font-serif text-lg leading-relaxed">
        {entry.text}
      </p>
      <ReflectionPanel entryId={entry.id} initialReflection={reflection} />
    </article>
  );
}

export default function EntryPage(props: PageProps<"/journal/[id]">) {
  return (
    <div className="mx-auto max-w-5xl">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <EntryView params={props.params} />
      </Suspense>
    </div>
  );
}
