export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-6 py-16"
    >
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div
        aria-hidden="true"
        className="h-10 w-2/3 animate-pulse rounded-md bg-muted"
      />
      <div
        aria-hidden="true"
        className="h-5 w-full animate-pulse rounded-md bg-muted"
      />
      <div
        aria-hidden="true"
        className="h-5 w-5/6 animate-pulse rounded-md bg-muted"
      />
    </main>
  );
}
