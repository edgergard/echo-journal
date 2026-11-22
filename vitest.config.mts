import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const fromRoot = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors the "@/*" path in tsconfig.json.
      "@": fromRoot("./src"),
      // Next.js resolves `server-only` to a no-op through the "react-server" condition;
      // Vitest doesn't, so the package would throw on import in tests.
      "server-only": fromRoot("./node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
