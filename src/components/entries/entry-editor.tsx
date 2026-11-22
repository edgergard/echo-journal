"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ENTRY_TEXT_MAX,
  type EntryInput,
  EntryInputSchema,
} from "@/contracts/journal";

import { MoodPicker } from "./mood-picker";

export type EditorSubmitResult = { ok: true } | { ok: false; error: string };

interface EntryEditorProps {
  initial?: Partial<EntryInput>;
  submitLabel: string;
  onSubmit: (input: EntryInput) => Promise<EditorSubmitResult>;
  onCancel: () => void;
  /** Ask before cancelling when there is unsaved text (new entries). */
  confirmDiscard?: boolean;
  /** Shown under the fields, before the buttons. */
  note?: string;
  autoFocus?: boolean;
}

const SAVE_ERROR =
  "Couldn't save your entry. Your text is still here — try again.";

/** Entry text + mood form (new entry, edit in place). */
export function EntryEditor({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  confirmDiscard = false,
  note,
  autoFocus,
}: EntryEditorProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // After a successful save the page navigates away; stay in "Saving…" until then.
  const [saved, setSaved] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EntryInput>({
    resolver: zodResolver(EntryInputSchema),
    defaultValues: { text: initial?.text ?? "", mood: initial?.mood },
  });

  const busy = isSubmitting || saved;
  const text = useWatch({ control, name: "text" });
  const nearLimit = text.length > ENTRY_TEXT_MAX * 0.9;

  async function submit(input: EntryInput) {
    setFormError(null);
    try {
      const result = await onSubmit(input);
      if (result.ok) setSaved(true);
      else setFormError(result.error);
    } catch {
      setFormError(SAVE_ERROR);
    }
  }

  function cancel() {
    if (confirmDiscard && text.trim() !== "") setConfirmOpen(true);
    else onCancel();
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-2">
        <Textarea
          {...register("text")}
          aria-label="Entry text"
          placeholder="What's on your mind today?"
          rows={8}
          autoFocus={autoFocus}
          readOnly={busy}
          aria-invalid={errors.text ? true : undefined}
          aria-describedby={errors.text ? "entry-text-error" : undefined}
          className="min-h-48 rounded-none border-0 border-b border-border bg-transparent px-0 py-2 font-serif text-lg leading-relaxed focus-visible:border-ring focus-visible:ring-0 md:text-lg dark:bg-transparent"
        />
        <div className="flex items-start justify-between gap-4">
          <p
            id="entry-text-error"
            role={errors.text ? "alert" : undefined}
            className="text-sm text-destructive"
          >
            {errors.text?.message}
          </p>
          {nearLimit ? (
            <p
              aria-live="polite"
              className="shrink-0 text-sm text-muted-foreground"
            >
              {text.length} / {ENTRY_TEXT_MAX}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Controller
          control={control}
          name="mood"
          render={({ field }) => (
            <MoodPicker
              value={field.value}
              onChange={field.onChange}
              invalid={Boolean(errors.mood)}
              errorId="entry-mood-error"
              disabled={busy}
            />
          )}
        />
        {errors.mood ? (
          <p
            id="entry-mood-error"
            role="alert"
            className="text-sm text-destructive"
          >
            Pick how you feel.
          </p>
        ) : null}
      </div>

      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          onClick={cancel}
          disabled={busy}
        >
          Cancel
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              What you wrote won&apos;t be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep writing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onCancel}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
