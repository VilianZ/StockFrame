import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const serverOnlyShim = fileURLToPath(
  new URL("./tests/server-only-shim.ts", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: {
      "server-only": serverOnlyShim,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
