import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["supabase/tests/**/*.test.ts"], // include all your edge function tests
    setupFiles: "./vitest.setup.ts",          // global setup file
    environment: "node",                       // use node environment for Deno/edge functions
    globals: true,                             // optional: allows using describe/it without import
  },
});
