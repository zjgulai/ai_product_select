#!/usr/bin/env tsx
/**
 * TikTok 手动导入 CLI
 *
 * 用法：
 *   npm run crawl:tiktok:import -- --file=path/to/data.json
 *   npm run crawl:tiktok:import -- --urls="https://tiktok.com/@user1/video/123,https://tiktok.com/@user2/video/456"
 *
 * JSON 格式示例：
 *   [
 *     { "videoId": "123", "title": "...", "creatorName": "...", "views": 1000000, "likes": 50000 }
 *   ]
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REAL_DATA_DIR = join(process.cwd(), "src", "data", "real");

// ---- 解析参数 ----
const args = process.argv.slice(2);
const flags: Record<string, string> = {};
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith("--")) {
    const eqIdx = arg.indexOf("=");
    let key: string;
    let value: string;
    if (eqIdx > 2) {
      key = arg.slice(2, eqIdx);
      value = arg.slice(eqIdx + 1);
    } else {
      key = arg.slice(2);
      value = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "true";
      if (value !== "true") i++;
    }
    flags[key] = value;
  }
}

// ---- 主流程 ----
function main() {
  console.log("\n📥 TikTok Manual Import\n");

  let videos: any[] = [];

  if (flags.file) {
    // 从 JSON 文件导入
    const content = readFileSync(flags.file, "utf-8");
    const parsed = JSON.parse(content);
    videos = Array.isArray(parsed) ? parsed : parsed.data || [];
    console.log(`📂 Loaded ${videos.length} videos from ${flags.file}`);
  } else if (flags.urls) {
    // 从 URL 列表创建基础结构
    const urls = flags.urls.split(",").map((u) => u.trim());
    videos = urls.map((url) => {
      const match = url.match(/\/video\/(\d+)/);
      return {
        videoId: match ? match[1] : "",
        title: "",
        creatorName: "",
        creatorId: "",
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        hashtags: [],
        date: new Date().toISOString().slice(0, 10),
        coverUrl: "",
        sourceUrl: url,
      };
    });
    console.log(`🔗 Created ${videos.length} video entries from URLs`);
    console.log("⚠️  Please edit the output file to fill in title, views, likes, etc.");
  } else {
    console.error("❌ Please provide --file=path.json or --urls=url1,url2");
    console.log("\nExamples:");
    console.log('  npm run crawl:tiktok:import -- --file=./my-tiktok-data.json');
    console.log('  npm run crawl:tiktok:import -- --urls="https://tiktok.com/@user/video/123"');
    process.exit(1);
  }

  if (videos.length === 0) {
    console.error("❌ No videos to import");
    process.exit(1);
  }

  // 保存到 real 数据目录
  const date = new Date().toISOString().slice(0, 10);
  const filename = `tiktok_videos_manual_us_${date}.json`;
  const filePath = join(REAL_DATA_DIR, filename);

  const payload = {
    collectedAt: new Date().toISOString(),
    source: "tiktok_manual_import",
    marketplace: "us",
    count: videos.length,
    data: videos,
  };

  if (!existsSync(REAL_DATA_DIR)) {
    const { mkdirSync } = require("node:fs");
    mkdirSync(REAL_DATA_DIR, { recursive: true });
  }

  writeFileSync(filePath, JSON.stringify(payload, null, 2));

  console.log(`\n💾 Saved to: ${filePath}`);
  console.log(`✅ Imported ${videos.length} TikTok videos\n`);
  console.log("Next steps:");
  console.log("  1. If you used --urls, edit the JSON file to add title, views, likes, etc.");
  console.log("  2. Restart the dev server to load the new data.");
  console.log("  3. The data will appear in TikTok analysis pages.\n");
}

main();
