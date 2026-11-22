import * as z from "zod";

/**
 * Server-only variables. Never reach the browser bundle.
 * To add one: add it here and to .env.example.
 */
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // DATABASE_URL: z.url(),
});

/**
 * Browser-safe variables. Names must start with NEXT_PUBLIC_.
 * To add one: add it here, to `clientValues` below and to .env.example.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("nextjs-pet-template"),
});

/**
 * Next.js inlines NEXT_PUBLIC_* values at build time only for literal
 * `process.env.NEXT_PUBLIC_*` reads, so every client variable is listed by hand.
 * `satisfies` makes TypeScript flag a schema key that is missing here.
 */
const clientValues = {
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
} satisfies Record<keyof z.input<typeof clientSchema>, string | undefined>;

type ServerEnv = z.output<typeof serverSchema>;
type ClientEnv = z.output<typeof clientSchema>;

const isServer = typeof window === "undefined";

/** Treats `KEY=` (empty string) in .env files as "not set", so defaults apply. */
function withoutEmptyStrings(values: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ]),
  );
}

function parseEnv<Schema extends z.ZodType>(
  schema: Schema,
  values: Record<string, string | undefined>,
  scope: "server" | "client",
): z.output<Schema> {
  const result = schema.safeParse(withoutEmptyStrings(values));
  if (!result.success) {
    throw new Error(
      `Invalid ${scope} environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

const clientEnv = parseEnv(clientSchema, clientValues, "client");
// Server variables are validated on the server only; the browser never sees them.
const serverEnv = isServer
  ? parseEnv(serverSchema, process.env, "server")
  : undefined;

const serverKeys = new Set<string>(Object.keys(serverSchema.shape));

/**
 * Validated environment. Import it instead of reading `process.env` directly.
 * Reading a server-only key in browser code throws instead of returning `undefined`.
 */
export const env = new Proxy(
  { ...serverEnv, ...clientEnv } as ServerEnv & ClientEnv,
  {
    get(target, key, receiver) {
      if (!isServer && typeof key === "string" && serverKeys.has(key)) {
        throw new Error(
          `Server-only environment variable "${key}" was read in browser code.`,
        );
      }
      return Reflect.get(target, key, receiver) as unknown;
    },
  },
);
