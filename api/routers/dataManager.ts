import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { dataFiles, dataTemplates, dynamicData } from "@db/schema";
import { eq, desc, like, and } from "drizzle-orm";
import { mkdir, unlink } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "uploads");

try { await mkdir(UPLOAD_DIR, { recursive: true }); } catch { /* exists */ }

// ===== Data Templates =====
const templateRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(dataTemplates).orderBy(dataTemplates.page, dataTemplates.module);
  }),

  getByKey: publicQuery
    .input(z.object({ dataKey: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [t] = await db.select().from(dataTemplates)
        .where(eq(dataTemplates.dataKey, input.dataKey))
        .limit(1);
      return t ?? null;
    }),
});

// ===== Dynamic Data (universal store) =====
const dynamicRouter = createRouter({
  // Query data by key (for frontend pages)
  queryByKey: publicQuery
    .input(z.object({ dataKey: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select()
        .from(dynamicData)
        .where(eq(dynamicData.dataKey, input.dataKey))
        .orderBy(dynamicData.sortOrder);
      return rows.map(r => r.recordData);
    }),

  // Get all data keys that have data
  getActiveKeys: publicQuery.query(async () => {
    const db = getDb();
    const result = await db.selectDistinct({ dataKey: dynamicData.dataKey })
      .from(dynamicData);
    return result.map(r => r.dataKey);
  }),

  // Insert multiple records for a data key
  bulkInsert: publicQuery
    .input(z.object({
      dataKey: z.string(),
      records: z.array(z.record(z.string(), z.any())),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // First delete existing data for this key
      await db.delete(dynamicData).where(eq(dynamicData.dataKey, input.dataKey));
      // Insert new records
      const values = input.records.map((r, i) => ({
        dataKey: input.dataKey,
        recordData: r,
        sortOrder: i,
      }));
      if (values.length > 0) {
        await db.insert(dynamicData).values(values);
      }
      return { success: true, inserted: values.length };
    }),

  // Delete all data for a key
  deleteByKey: publicQuery
    .input(z.object({ dataKey: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(dynamicData).where(eq(dynamicData.dataKey, input.dataKey));
      return { success: true };
    }),
    _deleteById: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(dynamicData).where(eq(dynamicData.id, input.id));
      return { success: true };
    }),
});

// ===== File Uploads (metadata + Excel parse + store) =====
const fileRouter = createRouter({
  list: publicQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["active", "archived", "deleted"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(dataFiles.status, input.status));
      else conditions.push(eq(dataFiles.status, "active"));
      if (input?.search) conditions.push(like(dataFiles.originalName, `%${input.search}%`));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const files = await db.select().from(dataFiles).where(where).orderBy(desc(dataFiles.uploadedAt));
      return { files, total: files.length };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [f] = await db.select().from(dataFiles).where(eq(dataFiles.id, input.id)).limit(1);
      return f ?? null;
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [f] = await db.select().from(dataFiles).where(eq(dataFiles.id, input.id)).limit(1);
      if (!f) return { success: false };

      await db.update(dataFiles).set({ status: "deleted" }).where(eq(dataFiles.id, input.id));
      try { await unlink(join(UPLOAD_DIR, f.fileName)); } catch { /* ok */ }
      return { success: true };
    }),

  archive: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(dataFiles).set({ status: "archived" }).where(eq(dataFiles.id, input.id));
      return { success: true };
    }),

  restore: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(dataFiles).set({ status: "active" }).where(eq(dataFiles.id, input.id));
      return { success: true };
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(dataFiles);
    return {
      totalFiles: all.length,
      activeFiles: all.filter(f => f.status === "active").length,
      totalSize: all.reduce((s, f) => s + f.fileSize, 0),
      totalRows: all.reduce((s, f) => s + (f.rowCount ?? 0), 0),
    };
  }),
});

export const dataManagerRouter = createRouter({
  template: templateRouter,
  dynamic: dynamicRouter,
  file: fileRouter,
});
