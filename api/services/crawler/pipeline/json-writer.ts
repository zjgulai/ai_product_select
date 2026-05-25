/**
 * 爬虫数据 → JSON 文件写入
 *
 * 验证阶段快速方案：将真实数据保存到 JSON 文件，
 * mock 数据层优先加载这些真实数据，无需数据库配置。
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const REAL_DATA_DIR = join(process.cwd(), "src", "data", "real");

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export interface JsonWriteOptions {
  source: string;
  marketplace: string;
  data: unknown[];
}

/**
 * 将采集数据写入 JSON 文件
 */
export function writeToJSON(opts: JsonWriteOptions): { filePath: string; count: number } {
  ensureDir(REAL_DATA_DIR);

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${opts.source}_${opts.marketplace}_${dateStr}.json`;
  const filePath = join(REAL_DATA_DIR, fileName);

  const payload = {
    collectedAt: new Date().toISOString(),
    source: opts.source,
    marketplace: opts.marketplace,
    count: opts.data.length,
    data: opts.data,
  };

  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");

  return { filePath, count: opts.data.length };
}

/**
 * 读取最新采集的真实数据
 */
export function readRealData<T>(source: string, marketplace: string): T[] | null {
  ensureDir(REAL_DATA_DIR);

  const prefix = `${source}_${marketplace}_`;
  const matchingFiles = readdirSync(REAL_DATA_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
    .sort()
    .reverse();

  if (matchingFiles.length === 0) return null;

  const latestFile = join(REAL_DATA_DIR, matchingFiles[0]);
  const content = JSON.parse(readFileSync(latestFile, "utf-8"));
  return content.data as T[];
}

/**
 * 列出所有可用的真实数据源
 */
export function listRealDataSources(): { source: string; marketplace: string; date: string; count: number }[] {
  ensureDir(REAL_DATA_DIR);

  return readdirSync(REAL_DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const content = JSON.parse(readFileSync(join(REAL_DATA_DIR, f), "utf-8"));
      return {
        source: content.source,
        marketplace: content.marketplace,
        date: content.collectedAt.slice(0, 10),
        count: content.count,
      };
    });
}
