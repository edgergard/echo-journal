import { env } from "@/env";

export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  description:
    "A web journal whose AI companion replies to each entry with memory of your past entries and sums up your week.",
} as const;
