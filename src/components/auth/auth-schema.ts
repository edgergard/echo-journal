import * as z from "zod";

/** Sign-in form (client validation) and magic-link action input (server). */
export const EmailSignInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .pipe(z.email("Enter a valid email address.")),
});
export type EmailSignInInput = z.input<typeof EmailSignInSchema>;
export type EmailSignInValues = z.output<typeof EmailSignInSchema>;

/** Result of the "Try the demo" form action (useActionState). */
export type DemoSignInState = { status: "idle" } | { status: "error" };

export type EmailLinkResult =
  | { status: "sent"; email: string }
  | { status: "invalid" }
  | { status: "not-configured" }
  | { status: "error" };

/** On success the GitHub action redirects to the provider instead. */
export type GitHubSignInResult =
  { status: "not-configured" } | { status: "error" };

export type SendEmailLink = (input: {
  email: string;
  next: string;
}) => Promise<EmailLinkResult>;

export type SignInWithGitHub = (input: {
  next: string;
}) => Promise<GitHubSignInResult>;

export type DemoSignIn = (
  state: DemoSignInState,
  formData: FormData,
) => Promise<DemoSignInState>;

export const AUTH_COPY = {
  notConfigured:
    "Email sign-in isn't set up in this preview. Try the demo instead.",
  sendFailed: "Couldn't send the link. Check the address and try again.",
  gitHubFailed: "Couldn't reach GitHub. Try again in a moment.",
  demoFailed: "Couldn't open the demo. Try again in a moment.",
  callbackFailed:
    "That sign-in link didn't work — it may have expired. Request a new one.",
} as const;
