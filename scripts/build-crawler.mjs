#!/usr/bin/env node
/**
 * 用 esbuild 打包爬虫 CLI
 */

import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// esbuild plugin: 为相对路径自动添加 .ts 扩展名
const tsResolvePlugin = {
  name: "ts-resolve",
  setup(build) {
    build.onResolve({ filter: /\./ }, (args) => {
      // 只处理相对路径且不带扩展名的导入
      if (!args.path.startsWith(".") || args.path.match(/\.[a-zA-Z]+$/)) return;

      const baseDir = dirname(args.importer);
      const targetPath = resolve(baseDir, args.path);

      // 尝试 .ts, .tsx, .js 扩展名
      const extensions = [".ts", ".tsx", ".js", ".jsx"];
      for (const ext of extensions) {
        const fullPath = targetPath + ext;
        if (existsSync(fullPath)) {
          return { path: fullPath };
        }
      }

      // 尝试 index.ts
      for (const ext of extensions) {
        const indexPath = join(targetPath, "index" + ext);
        if (existsSync(indexPath)) {
          return { path: indexPath };
        }
      }

      return undefined;
    });
  },
};

await build({
  entryPoints: [join(__dirname, "../api/services/crawler/cli/crawl.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: join(__dirname, "../dist/crawler-cli.js"),
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
  alias: {
    "@": join(__dirname, "../src"),
    "@contracts": join(__dirname, "../contracts"),
    "@db": join(__dirname, "../db"),
    db: join(__dirname, "../db"),
  },
  plugins: [tsResolvePlugin],
  external: [
    "playwright",
    "drizzle-orm",
    "mysql2",
    "zod",
    "@trpc/*",
    "better-sqlite3",
  ],
});

console.log("✅ Crawler CLI built to dist/crawler-cli.js");
