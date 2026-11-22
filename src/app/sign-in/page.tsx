import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

/** Stub — stream 1-auth builds it (design.md: sign-in). */
export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <h1 className="font-heading text-3xl font-medium">Sign in to Echo</h1>
    </main>
  );
}
