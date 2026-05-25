#!/usr/bin/env python3
"""将 JSON 数据转换为 TypeScript 常量模块，供 mock-router 使用"""

import json
from pathlib import Path

INDIR = Path(__file__).parent / "output"
OUTDIR = Path(__file__).parent.parent.parent / "src" / "data" / "generated"
OUTDIR.mkdir(parents=True, exist_ok=True)

def json_to_ts_const(name, data, export_name):
    """将 JSON 数据转为 TypeScript const 导出"""
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    # 处理多行字符串，确保 TypeScript 兼容
    ts_content = f"""/* eslint-disable */
// 自动生成 — 母婴品类 realistic 数据
// 生成时间: {__import__('datetime').datetime.now().isoformat()}

export const {export_name} = {json_str} as const;
"""
    return ts_content

def main():
    mappings = [
        ("concepts.json", "CONCEPTS_DATA", "concepts.ts"),
        ("tiktok_products.json", "TIKTOK_PRODUCTS", "tiktokProducts.ts"),
        ("tiktok_creators.json", "TIKTOK_CREATORS", "tiktokCreators.ts"),
        ("tiktok_shops.json", "TIKTOK_SHOPS", "tiktokShops.ts"),
        ("tiktok_videos.json", "TIKTOK_VIDEOS", "tiktokVideos.ts"),
        ("tiktok_lives.json", "TIKTOK_LIVES", "tiktokLives.ts"),
        ("amazon_products.json", "AMAZON_PRODUCTS", "amazonProducts.ts"),
        ("amazon_reviews.json", "AMAZON_REVIEWS", "amazonReviews.ts"),
        ("concept_metrics.json", "CONCEPT_METRICS", "conceptMetrics.ts"),
        ("ipms_projects.json", "IPMS_PROJECTS", "ipmsProjects.ts"),
    ]

    for json_file, const_name, ts_file in mappings:
        json_path = INDIR / json_file
        if not json_path.exists():
            print(f"⚠ 跳过: {json_file} 不存在")
            continue

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        ts_content = json_to_ts_const(json_file, data, const_name)
        ts_path = OUTDIR / ts_file
        with open(ts_path, "w", encoding="utf-8") as f:
            f.write(ts_content)

        print(f"✓ {json_file:30s} → {ts_file:25s} ({len(data)} 条记录)")

    print(f"\n输出目录: {OUTDIR}")

if __name__ == "__main__":
    main()
