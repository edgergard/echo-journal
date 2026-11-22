"use client";

import { Trash2 } from "lucide-react";
import { useId, useState, useTransition } from "react";

import { PendingLabel } from "@/components/auth/pending-label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import type { SettingsAction } from "./settings-types";

/**
 * "Delete account" with confirmation (design.md: DeleteAccountDialog).
 * On success the action redirects to the landing page.
 */
export function DeleteAccountDialog({ action }: { action: SettingsAction }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const labelId = useId();

  const onOpenChange = (next: boolean) => {
    if (pending) return;
    setFailed(false);
    setOpen(next);
  };

  const confirm = () => {
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) setFailed(true);
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            size="lg"
            className="h-11 self-start px-5 text-base"
          />
        }
      >
        <Trash2 aria-hidden="true" />
        Delete account
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            {"All entries and replies will be removed. You can't undo this."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {failed ? (
          <p role="alert" className="text-sm text-destructive">
            {"Couldn't delete your account. Try again."}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={confirm}
            disabled={pending}
            focusableWhenDisabled
            aria-busy={pending || undefined}
            aria-labelledby={labelId}
            className="data-disabled:opacity-70"
          >
            <PendingLabel id={labelId} pending={pending}>
              {pending ? "Deleting…" : "Delete account"}
            </PendingLabel>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
