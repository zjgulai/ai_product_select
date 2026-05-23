import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { dataFiles, dynamicData, dataTemplates } from "@db/schema";
import { writeFile, mkdir, unlink, readFile, stat } from "fs/promises";
import { join } from "path";
import { eq } from "drizzle-orm";

const app = new Hono<{ Bindings: HttpBindings }>();
const UPLOAD_DIR = join(process.cwd(), "uploads");

try { await mkdir(UPLOAD_DIR, { recursive: true }); } catch { /* exists */ }

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// ===== File Upload + Excel Parse + Store to dynamic_data =====
app.post("/api/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const dataKey = formData.get("dataKey") as string | null;

  if (!file) return c.json({ success: false, error: "No file provided" }, 400);

  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel", "text/csv",
  ];
  const isValid = validTypes.includes(file.type) || file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv");
  if (!isValid) return c.json({ success: false, error: "Only Excel (.xlsx, .xls) and CSV files are supported" }, 400);

  try {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}_${safeName}`;
    const filePath = join(UPLOAD_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Parse Excel
    let rowCount = 0;
    let sheetNames: string[] = [];
    let columns: { name: string; type: string }[] = [];
    let parsedRecords: Record<string, any>[] = [];

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      sheetNames = workbook.SheetNames;

      if (sheetNames.length > 0) {
        const firstSheet = workbook.Sheets[sheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" }) as any[][];
        rowCount = Math.max(0, jsonData.length - 1);

        if (jsonData.length > 0) {
          const headers = jsonData[0].map(h => String(h ?? "").trim());
          columns = headers.map(h => ({ name: h, type: "string" }));

          // Parse data rows into objects
          for (let i = 1; i < jsonData.length; i++) {
            const row: Record<string, any> = {};
            headers.forEach((h, j) => {
              const val = jsonData[i][j];
              // Try to auto-detect numbers
              if (typeof val === "number") row[h] = val;
              else if (typeof val === "boolean") row[h] = val;
              else if (val === "true" || val === "TRUE") row[h] = true;
              else if (val === "false" || val === "FALSE") row[h] = false;
              else if (typeof val === "string" && !isNaN(Number(val)) && val !== "") row[h] = Number(val);
              else row[h] = val ?? "";
            });
            parsedRecords.push(row);
          }
        }
      }
    } catch {
      // parsing failed but file saved
    }

    // Save file metadata
    const db = getDb();
    const [fileResult] = await db.insert(dataFiles).values({
      originalName: file.name, fileName, fileType: file.type || "application/octet-stream",
      fileSize: file.size, rowCount, sheetNames, columns, status: "active",
    });

    // If dataKey provided, store parsed data to dynamic_data
    if (dataKey && parsedRecords.length > 0) {
      // Clear existing data for this key
      await db.delete(dynamicData).where(eq(dynamicData.dataKey, dataKey));
      // Insert new records
      await db.insert(dynamicData).values(
        parsedRecords.map((r, i) => ({
          dataKey,
          recordData: r,
          sortOrder: i,
        }))
      );
    }

    return c.json({
      success: true,
      file: {
        id: Number(fileResult.insertId),
        originalName: file.name, fileSize: file.size, rowCount,
        sheetCount: sheetNames.length, parsedRecords: parsedRecords.length,
        dataKey: dataKey ?? undefined,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || "Upload failed" }, 500);
  }
});

// ===== File Download =====
app.get("/api/download/:fileName", async (c) => {
  const fileName = c.req.param("fileName");
  const filePath = join(UPLOAD_DIR, fileName);
  try {
    const buf = await readFile(filePath);
    const s = await stat(filePath);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(s.size),
      },
    });
  } catch { return c.json({ error: "File not found" }, 404); }
});

// ===== Export data as Excel =====
app.get("/api/export/:dataKey", async (c) => {
  const dataKey = c.req.param("dataKey");
  try {
    const XLSX = await import("xlsx");
    const db = getDb();
    const rows = await db.select().from(dynamicData).where(eq(dynamicData.dataKey, dataKey));
    if (rows.length === 0) return c.json({ error: "No data found" }, 404);

    const records = rows.map(r => r.recordData);
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${dataKey}_export.xlsx"`,
      },
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ===== tRPC =====
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc", req: c.req.raw,
    router: appRouter, createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);
  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
