// ========================================================================
// Fusion 数据库查询层
// ========================================================================

import { getDb } from "../../queries/connection";
import { productConcepts, conceptMetrics, keywordMappings, fusionReports } from "@db/schema";
import { eq, like, sql, desc, and, or } from "drizzle-orm";

// ---- Product Concepts ----

export async function dbGetProductConcepts(opts?: { search?: string; category?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  let query = db.select().from(productConcepts);

  if (opts?.search) {
    const q = `%${opts.search}%`;
    query = db.select().from(productConcepts).where(
      or(like(productConcepts.name, q), like(productConcepts.nameEn, q))
    ) as any;
  }

  const items = await query.limit(limit).offset(offset);
  const total = (await db.select({ count: sql<number>`count(*)` }).from(productConcepts))[0].count;

  return { items, total };
}

export async function dbGetProductConceptById(conceptId: string) {
  const db = getDb();
  const rows = await db.select().from(productConcepts).where(eq(productConcepts.conceptId, conceptId)).limit(1);
  return rows[0] ?? null;
}

// ---- Concept Metrics ----

export async function dbGetConceptMetrics(conceptId?: string, limit = 30) {
  const db = getDb();
  const items = await (conceptId
    ? db.select().from(conceptMetrics).where(eq(conceptMetrics.conceptId, conceptId)).orderBy(desc(conceptMetrics.metricDate)).limit(limit)
    : db.select().from(conceptMetrics).orderBy(desc(conceptMetrics.metricDate)).limit(limit)
  );
  return { items, total: items.length };
}

export async function dbGetLatestMetrics(limit = 20) {
  const db = getDb();

  // Get latest metrics per concept
  const rows = await db.select()
    .from(conceptMetrics)
    .orderBy(desc(conceptMetrics.metricDate))
    .limit(limit * 2);

  // Deduplicate by conceptId, keep only latest
  const seen = new Set<string>();
  const items = [];
  for (const row of rows) {
    if (!seen.has(row.conceptId)) {
      seen.add(row.conceptId);
      // Join with concept name
      const concept = await db.select({ name: productConcepts.name }).from(productConcepts)
        .where(eq(productConcepts.conceptId, row.conceptId)).limit(1);
      items.push({
        ...row,
        conceptName: concept[0]?.name || row.conceptId,
      });
    }
    if (items.length >= limit) break;
  }

  return items;
}

// ---- Keyword Mappings ----

export async function dbGetKeywordMappings(opts?: { tiktokKeyword?: string; amazonKeyword?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const conditions = [];
  if (opts?.tiktokKeyword) conditions.push(like(keywordMappings.tiktokKeyword, `%${opts.tiktokKeyword}%`));
  if (opts?.amazonKeyword) conditions.push(like(keywordMappings.amazonKeyword, `%${opts.amazonKeyword}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await (whereClause
    ? db.select().from(keywordMappings).where(whereClause).limit(limit).offset(offset)
    : db.select().from(keywordMappings).limit(limit).offset(offset)
  );
  const total = (await (whereClause
    ? db.select({ count: sql<number>`count(*)` }).from(keywordMappings).where(whereClause)
    : db.select({ count: sql<number>`count(*)` }).from(keywordMappings)
  ))[0].count;

  return { items, total };
}

// ---- Fusion Reports ----

export async function dbGetFusionReports(opts?: { userId?: string; limit?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 10;
  const items = await (opts?.userId
    ? db.select().from(fusionReports).where(like(fusionReports.userId, `%${opts.userId}%`)).orderBy(desc(fusionReports.createdAt)).limit(limit)
    : db.select().from(fusionReports).orderBy(desc(fusionReports.createdAt)).limit(limit)
  );
  const total = (await db.select({ count: sql<number>`count(*)` }).from(fusionReports))[0].count;
  return { items, total };
}

export async function dbGetFusionReportById(reportId: string) {
  const db = getDb();
  const rows = await db.select().from(fusionReports).where(eq(fusionReports.reportId, reportId)).limit(1);
  return rows[0] ?? null;
}
