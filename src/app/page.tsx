import { CopyCommand } from "@/components/copy-command";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">
          {siteConfig.name}
        </h1>
        <p className="text-lg text-muted-foreground">
          {siteConfig.description}
        </p>
      </header>

      <section aria-labelledby="next-steps" className="space-y-3">
        <h2 id="next-steps" className="text-xl font-medium">
          Next steps
        </h2>
        <p>
          Edit <code className="font-mono text-sm">src/app/page.tsx</code>, then
          run every check before committing:
        </p>
        <CopyCommand command="npm run check" />
      </section>

      {process.env.NODE_ENV === "development" && (
        <p>
          Scripts, project structure and conventions are described in the{" "}
          {/* A plain <a>: /readme is a dev-only Route Handler (text/plain), not a page. */}
          <a
            href="/readme"
            className="font-medium underline underline-offset-4"
          >
            README
          </a>
          .
        </p>
      )}
    </main>
  );
}
