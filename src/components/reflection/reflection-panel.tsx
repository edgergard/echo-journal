"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { RecalledRef, Reflection } from "@/contracts/journal";

import { CrisisCard } from "./crisis-card";
import { RecalledNote } from "./recalled-note";
import { requestReflection } from "./request-reflection";

/** Props are a contract: stream 1-entries renders this on the entry page. */
export interface ReflectionPanelProps {
  entryId: string;
  initialReflection: Reflection | null;
  /**
   * The entry was just created — request a reply now. The entry page itself
   * announces "Entry saved"; the panel only announces "Echo is replying…" /
   * "Reply ready".
   */
  justSaved?: boolean;
  /** The entry was edited — offer "Regenerate reply". */
  edited?: boolean;
}

type PanelState =
  | { kind: "streaming"; text: string }
  | { kind: "done"; text: string; recalled: RecalledRef[] }
  | { kind: "crisis" }
  | { kind: "limit"; text: string }
  | { kind: "error" };

const COPY = {
  replying: "Echo is replying…",
  ready: "Reply ready",
  noMemory: "Echo starts recalling after a few entries.",
  error: "Echo couldn't reply right now. Your entry is saved.",
  limitFallback: "You've used today's replies. Echo will be back tomorrow.",
  disclaimer: "Echo is not a therapist.",
} as const;

const utcDay = (date: Date) => date.toISOString().slice(0, 10);

function stateFrom(reflection: Reflection | null): PanelState {
  switch (reflection?.status) {
    case undefined:
      return { kind: "streaming", text: "" };
    case "done":
      return {
        kind: "done",
        text: reflection.text,
        recalled: reflection.recalled,
      };
    case "crisis":
      return { kind: "crisis" };
    case "limit":
      return { kind: "limit", text: reflection.text || COPY.limitFallback };
    case "error":
      return { kind: "error" };
  }
}

/**
 * Ask Echo on mount when there is no reply yet, when the entry was just saved
 * (and has no reply or crisis card), or when a limit was hit on an earlier
 * UTC day — "Echo will be back tomorrow".
 */
function shouldRequest(
  reflection: Reflection | null,
  justSaved: boolean,
): boolean {
  if (!reflection) return true;
  if (reflection.status === "done" || reflection.status === "crisis") {
    return false;
  }
  if (justSaved) return true;
  return (
    reflection.status === "limit" &&
    utcDay(new Date(reflection.createdAt)) < utcDay(new Date())
  );
}

/** Echo's reply with "Recalled" margin notes (design.md: entry → ReflectionPanel). */
export function ReflectionPanel(props: ReflectionPanelProps) {
  // A new entry starts from a clean panel even if the component is reused.
  return <Panel key={props.entryId} {...props} />;
}

function Panel({
  entryId,
  initialReflection,
  justSaved = false,
  edited = false,
}: ReflectionPanelProps) {
  const [autoRequest] = useState(() =>
    shouldRequest(initialReflection, justSaved),
  );
  const [state, setState] = useState<PanelState>(() =>
    autoRequest
      ? { kind: "streaming", text: "" }
      : stateFrom(initialReflection),
  );
  const [announcement, setAnnouncement] = useState("");
  const [regenerated, setRegenerated] = useState(false);
  const inFlight = useRef(false);

  const ask = useCallback(
    async (regenerate: boolean) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setState({ kind: "streaming", text: "" });
      setAnnouncement(COPY.replying);
      try {
        const result = await requestReflection(
          { entryId, regenerate },
          (text) => setState({ kind: "streaming", text }),
        );
        switch (result.status) {
          case "crisis":
            setState({ kind: "crisis" });
            setAnnouncement("");
            break;
          case "limit":
            setState({
              kind: "limit",
              text: result.text || COPY.limitFallback,
            });
            setAnnouncement(result.text || COPY.limitFallback);
            break;
          default:
            setState({
              kind: "done",
              text: result.text,
              recalled: result.recalled,
            });
            setAnnouncement(COPY.ready);
        }
        if (regenerate) setRegenerated(true);
      } catch {
        setState({ kind: "error" });
        setAnnouncement(COPY.error);
      } finally {
        inFlight.current = false;
      }
    },
    [entryId],
  );

  const started = useRef(false);
  useEffect(() => {
    // The ref guard keeps Strict Mode's double effect from asking twice.
    if (!autoRequest || started.current) return;
    started.current = true;
    void ask(false);
  }, [autoRequest, ask]);

  const streaming = state.kind === "streaming";
  const canRegenerate =
    edited &&
    !regenerated &&
    (state.kind === "done" || state.kind === "crisis");
  const recalled = state.kind === "done" ? state.recalled : [];

  return (
    <section
      aria-labelledby="echo-heading"
      className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18.75rem)]"
    >
      <div className="flex max-w-180 min-w-0 flex-col gap-3">
        <h2
          id="echo-heading"
          className="text-sm font-semibold text-muted-foreground"
        >
          Echo
        </h2>

        {state.kind === "crisis" ? (
          <CrisisCard />
        ) : (
          <div
            aria-busy={streaming}
            className="rounded-md border border-border bg-card px-6 py-6 text-card-foreground sm:px-8 sm:py-7"
          >
            <ReplyBody state={state} />
          </div>
        )}

        {state.kind !== "crisis" || canRegenerate ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3">
            {state.kind === "error" ? (
              <Button size="lg" className="px-4" onClick={() => void ask(true)}>
                Try again
              </Button>
            ) : null}
            {canRegenerate ? (
              <Button
                size="lg"
                variant="secondary"
                className="border-border px-4"
                onClick={() => void ask(true)}
              >
                <RefreshCw aria-hidden="true" data-icon="inline-start" />
                Regenerate reply
              </Button>
            ) : null}
            {state.kind !== "crisis" ? (
              <p className="text-sm text-muted-foreground">{COPY.disclaimer}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {state.kind === "done" ? (
        <aside
          aria-label="Recalled entries"
          className="motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in lg:pt-8"
        >
          {recalled.length > 0 ? (
            <ul className="flex flex-col gap-7">
              {recalled.map((note) => (
                <li key={note.entryId}>
                  <RecalledNote note={note} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{COPY.noMemory}</p>
          )}
        </aside>
      ) : null}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}

const replyText =
  "max-w-[68ch] font-serif text-lg leading-[1.7] whitespace-pre-line";

function ReplyBody({
  state,
}: {
  state: Exclude<PanelState, { kind: "crisis" }>;
}) {
  switch (state.kind) {
    case "streaming":
      return state.text ? (
        <p className={replyText}>
          {state.text}
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-[1.1em] w-px translate-y-[0.2em] bg-foreground motion-safe:animate-pulse"
          />
        </p>
      ) : (
        <p
          aria-hidden="true"
          className="font-serif text-lg leading-[1.7] text-muted-foreground italic motion-safe:animate-pulse"
        >
          {COPY.replying}
        </p>
      );
    case "done":
      return <p className={replyText}>{state.text}</p>;
    case "limit":
      return <p className={replyText}>{state.text}</p>;
    case "error":
      return <p className={replyText}>{COPY.error}</p>;
  }
}
