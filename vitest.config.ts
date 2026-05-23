import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [react()],
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "src"),
      "@contracts": path.resolve(templateRoot, "contracts"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
      "@db": path.resolve(templateRoot, "db"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    include: [
      "api/**/*.test.ts",
      "api/**/*.spec.ts",
      "src/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: [
        "src/components/shared/**/*.{ts,tsx}",
        "api/services/mockData/**/*.ts",
        "api/routers/**/*.ts",
        "api/services/**/*.ts",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.ts",
        "**/node_modules/**",
      ],
      thresholds: {
        // 当前基线，逐步提高
        lines: 55,
        branches: 50,
        functions: 55,
        statements: 55,
      },
    },
  },
});
