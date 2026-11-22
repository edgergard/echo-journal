"use client";

import { ArrowLeft, Ellipsis, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  deleteEntryAction,
  updateEntryAction,
} from "@/app/(app)/journal/actions";
import { ReflectionPanel } from "@/components/reflection/reflection-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Entry, Reflection } from "@/contracts/journal";
import { routes } from "@/lib/routes";

import { DeleteEntryDialog } from "./delete-entry-dialog";
import { EntryEditor } from "./entry-editor";
import { formatEntryDate, formatLongDate, MOOD_LABELS } from "./mood";

interface EntryDetailProps {
  entry: Entry;
  reflection: Reflection | null;
  /** The entry was just created (`?saved=1`). */
  justSaved?: boolean;
}

/** The entry page body: header, text (or editor), actions, Echo's reply. */
export function EntryDetail({
  entry: initialEntry,
  reflection,
  justSaved = false,
}: EntryDetailProps) {
  const router = useRouter();
  const [entry, setEntry] = useState(initialEntry);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteEntryAction(entry.id);
      if (result.ok) {
        router.push(`${routes.journal}?deleted=1`);
        return;
      }
      setDeleteError("Couldn't delete this entry. Try again.");
    } catch {
      setDeleteError("Couldn't delete this entry. Try again.");
    }
    setDeleting(false);
  }

  return (
    <article className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <Link
          href={routes.journal}
          className="inline-flex w-fit items-center gap-2 rounded-md py-1 text-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Journal
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-medium sm:text-4xl">
              {formatLongDate(entry.createdAt)}
            </h1>
            <p className="mt-2 text-muted-foreground">
              <time dateTime={entry.createdAt}>
                {formatEntryDate(entry.createdAt)}
              </time>
              <span aria-hidden="true"> · </span>
              <span>Mood: {MOOD_LABELS[entry.mood]}</span>
            </p>
          </div>
          {editing ? null : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="icon-lg" />}
                aria-label="Entry actions"
              >
                <Ellipsis aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {justSaved ? (
          <p role="status" className="text-sm text-muted-foreground">
            Entry saved
          </p>
        ) : null}

        {editing ? (
          <EntryEditor
            initial={{ text: entry.text, mood: entry.mood }}
            submitLabel="Save changes"
            autoFocus
            onCancel={() => setEditing(false)}
            onSubmit={async (input) => {
              const result = await updateEntryAction(entry.id, input);
              if (!result.ok) return result;
              setEntry(result.entry);
              setEdited(true);
              setEditing(false);
              return { ok: true };
            }}
          />
        ) : (
          <p className="max-w-[68ch] font-serif text-lg leading-relaxed whitespace-pre-wrap">
            {entry.text}
          </p>
        )}
      </div>

      <ReflectionPanel
        entryId={entry.id}
        initialReflection={reflection}
        justSaved={justSaved}
        edited={edited}
      />

      <DeleteEntryDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteOpen(open);
        }}
        onConfirm={confirmDelete}
        deleting={deleting}
        error={deleteError}
      />
    </article>
  );
}
