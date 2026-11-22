"use client";

import { CheckIcon, CopyIcon, XIcon, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useCopyToClipboard,
  type CopyStatus,
} from "@/hooks/use-copy-to-clipboard";

const statusView: Record<
  CopyStatus,
  { label: string; announcement: string; Icon: LucideIcon }
> = {
  idle: { label: "Copy", announcement: "", Icon: CopyIcon },
  copied: {
    label: "Copied",
    announcement: "Command copied to clipboard",
    Icon: CheckIcon,
  },
  error: {
    label: "Copy failed",
    announcement: "Could not copy the command",
    Icon: XIcon,
  },
};

type CopyCommandProps = {
  command: string;
};

/** A shell command with a copy-to-clipboard button. */
export function CopyCommand({ command }: CopyCommandProps) {
  const { status, copy } = useCopyToClipboard();
  const { label, announcement, Icon } = statusView[status];

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted py-1.5 pr-1.5 pl-4">
      <code className="font-mono text-sm">{command}</code>
      <Button variant="outline" size="sm" onClick={() => void copy(command)}>
        <Icon aria-hidden="true" />
        {label}
        <span className="sr-only">: {command}</span>
      </Button>
      {/* Announces the result to screen readers without moving focus. */}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
