/**
 * ETL Pipeline 主调度器
 *
 * 数据流：ODS → DWD 清洗 → DWS 聚合 → Fusion 指标重算（Phase 11）
 *
 * 调用时机：dataManager.import.ingest 成功后
 */

import { getDb } from "../../queries/connection.ts";
import { productConcepts } from "@db/schema";
import { eq } from "drizzle-orm";
import { cleanTiktokProducts, cleanAmazonProducts } from "./dwd-cleaner.ts";
import {
  aggregateTiktokConceptDaily,
  aggregateAmazonConceptWeekly,
} from "./dws-aggregator.ts";

export interface ETLResult {
  dataKey: string;
  snapshotDate: string;
  dwd: { inputRows: number; outputRows: number };
  dws: { conceptsProcessed: number; details: unknown[] };
  durationMs: number;
}

/**
 * 根据 dataKey 路由到对应的 ETL Job
 */
export async function triggerETL(
  dataKey: string,
  snapshotDate: string
): Promise<ETLResult> {
  const start = Date.now();

  // ===== Step 1: DWD 清洗 =====
  let dwdResult: { inputRows: number; outputRows: number };

  switch (dataKey) {
    case "tiktok_products":
      dwdResult = await cleanTiktokProducts(snapshotDate);
      break;
    case "amazon_products":
      dwdResult = await cleanAmazonProducts(snapshotDate);
      break;
    default:
      // 其他 dataKey 暂不支持自动 ETL
      dwdResult = { inputRows: 0, outputRows: 0 };
  }

  // ===== Step 2: DWS 聚合（仅对支持的 dataKey）=====
  const dwsDetails: unknown[] = [];
  let conceptsProcessed = 0;

  if (dataKey === "tiktok_products" && dwdResult.outputRows > 0) {
    const db = getDb();
    const concepts = await db
      .select({ conceptId: productConcepts.conceptId })
      .from(productConcepts)
      .where(eq(productConcepts.status, "active"));

    for (const { conceptId } of concepts) {
      const result = await aggregateTiktokConceptDaily(conceptId, snapshotDate);
      if (result.output) {
        dwsDetails.push(result);
        conceptsProcessed++;
      }
    }
  }

  // TODO: Phase 11 — Fusion 指标重算
  // if (dwsDetails.length > 0) {
  //   await recalcAllConcepts(getDb(), snapshotDate);
  // }

  return {
    dataKey,
    snapshotDate,
    dwd: dwdResult,
    dws: { conceptsProcessed, details: dwsDetails },
    durationMs: Date.now() - start,
  };
}
