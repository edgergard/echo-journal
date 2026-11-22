"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";

type GlobalErrorProps = {
  error: unknown;
  retry: () => void;
};

/**
 * Replaces the root layout when it throws. Renders its own document without
 * global styles, so it uses plain inline styles and the OS color scheme.
 */
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" style={{ colorScheme: "light dark" }}>
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          maxWidth: "36rem",
          margin: "0 auto",
          padding: "4rem 1.5rem",
        }}
      >
        <title>Something went wrong</title>
        <main>
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Try again.</p>
          <button type="button" onClick={() => retry()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
