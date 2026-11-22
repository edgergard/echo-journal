import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EntryDetail } from "@/components/entries/entry-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { requireSession } from "@/server/auth/require-session";
import { getBackend } from "@/server/backend";

async function EntryView({
  params,
  searchParams,
}: {
  params: PageProps<"/journal/[id]">["params"];
  searchParams: PageProps<"/journal/[id]">["searchParams"];
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const session = await requireSession(routes.entry(id));
  const backend = getBackend();
  const entry = await backend.entries.get(session.userId, id);
  if (!entry) notFound();
  const reflection = await backend.reflections.get(session.userId, entry.id);
  return (
    <EntryDetail
      key={entry.id}
      entry={entry}
      reflection={reflection}
      justSaved={saved === "1"}
    />
  );
}

export default function EntryPage(props: PageProps<"/journal/[id]">) {
  return (
    <div className="mx-auto max-w-5xl">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <EntryView params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
