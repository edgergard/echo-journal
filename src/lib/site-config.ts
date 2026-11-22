import { env } from "@/env";

export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  description:
    "Next.js starter with the App Router, TypeScript, Tailwind CSS, shadcn/ui, Vitest and Claude Code configuration.",
} as const;
