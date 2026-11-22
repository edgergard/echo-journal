import { useCallback, useEffect, useRef, useState } from "react";

export type CopyStatus = "idle" | "copied" | "error";

/**
 * Copies text with the async Clipboard API and reports the outcome.
 * The status falls back to "idle" after `resetAfterMs`.
 */
export function useCopyToClipboard(resetAfterMs = 2000) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const copy = useCallback(
    async (text: string) => {
      clearTimeout(resetTimer.current);
      // Reset first so a repeated outcome changes the live region and is announced again.
      setStatus("idle");
      try {
        // Throws when the API is missing (insecure context) or permission is denied.
        await navigator.clipboard.writeText(text);
        setStatus("copied");
      } catch {
        setStatus("error");
      }
      resetTimer.current = setTimeout(() => setStatus("idle"), resetAfterMs);
    },
    [resetAfterMs],
  );

  return { status, copy };
}
