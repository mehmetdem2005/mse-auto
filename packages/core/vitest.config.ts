import { defineConfig } from "vitest/config";
export default defineConfig({
  // Source uses NodeNext-style ".js" specifiers that point to ".ts" files.
  // Rewrite them for Vite/vitest so the module graph resolves in tests.
  resolve: { alias: [{ find: /^(\.{1,2}\/.*)\.js$/, replacement: "$1" }] },
  test: { setupFiles: ["./test/setup.ts"], include: ["test/**/*.test.ts"] },
});
