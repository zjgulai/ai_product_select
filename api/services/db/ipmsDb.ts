// ========================================================================
// IPMS 数据库查询层
// ========================================================================

import { getDb } from "../../queries/connection";
import { ipmsProjects, ipmsStageHistory } from "@db/schema";
import { eq, sql, desc, and } from "drizzle-orm";

// ---- Projects ----

export async function dbGetIpmsProjects(opts?: { status?: string; priority?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const conditions = [];
  if (opts?.status) conditions.push(eq(ipmsProjects.status, opts.status as any));
  if (opts?.priority) conditions.push(eq(ipmsProjects.priority, opts.priority as any));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await (whereClause
    ? db.select().from(ipmsProjects).where(whereClause).orderBy(desc(ipmsProjects.createdAt)).limit(limit).offset(offset)
    : db.select().from(ipmsProjects).orderBy(desc(ipmsProjects.createdAt)).limit(limit).offset(offset)
  );
  const total = (await (whereClause
    ? db.select({ count: sql<number>`count(*)` }).from(ipmsProjects).where(whereClause)
    : db.select({ count: sql<number>`count(*)` }).from(ipmsProjects)
  ))[0].count;

  return { items, total };
}

export async function dbGetIpmsProjectById(projectId: string) {
  const db = getDb();
  const rows = await db.select().from(ipmsProjects).where(eq(ipmsProjects.projectId, projectId)).limit(1);
  return rows[0] ?? null;
}

export async function dbCreateIpmsProject(values: {
  projectId: string;
  conceptId?: string | null;
  projectName: string;
  description?: string | null;
  currentStage?: string;
  status?: string;
  priority?: string;
  owner?: string | null;
  targetLaunchDate?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const [result] = await db.insert(ipmsProjects).values({
    projectId: values.projectId,
    conceptId: values.conceptId ?? null,
    projectName: values.projectName,
    description: values.description ?? null,
    currentStage: (values.currentStage as any) ?? "charter",
    status: (values.status as any) ?? "active",
    priority: (values.priority as any) ?? "medium",
    owner: values.owner ?? null,
    targetLaunchDate: values.targetLaunchDate ? new Date(values.targetLaunchDate) : null,
    metadata: values.metadata ?? {},
  } as any);
  return { insertId: Number(result.insertId) };
}

export async function dbUpdateIpmsProject(projectId: string, values: Partial<{
  projectName: string;
  description: string | null;
  currentStage: string;
  status: string;
  priority: string;
  owner: string | null;
  targetLaunchDate: string | null;
  actualLaunchDate: string | null;
  metadata: Record<string, unknown>;
}>) {
  const db = getDb();
  const updateValues: any = {};
  if (values.projectName !== undefined) updateValues.projectName = values.projectName;
  if (values.description !== undefined) updateValues.description = values.description;
  if (values.currentStage !== undefined) updateValues.currentStage = values.currentStage;
  if (values.status !== undefined) updateValues.status = values.status;
  if (values.priority !== undefined) updateValues.priority = values.priority;
  if (values.owner !== undefined) updateValues.owner = values.owner;
  if (values.targetLaunchDate !== undefined) updateValues.targetLaunchDate = values.targetLaunchDate ? new Date(values.targetLaunchDate) : null;
  if (values.actualLaunchDate !== undefined) updateValues.actualLaunchDate = values.actualLaunchDate ? new Date(values.actualLaunchDate) : null;
  if (values.metadata !== undefined) updateValues.metadata = values.metadata;

  await db.update(ipmsProjects).set(updateValues).where(eq(ipmsProjects.projectId, projectId));
  return { success: true };
}

export async function dbDeleteIpmsProject(projectId: string) {
  const db = getDb();
  await db.delete(ipmsStageHistory).where(eq(ipmsStageHistory.projectId, projectId));
  await db.delete(ipmsProjects).where(eq(ipmsProjects.projectId, projectId));
  return { success: true };
}

// ---- Stage History ----

export async function dbGetIpmsStageHistory(projectId: string) {
  const db = getDb();
  const items = await db.select().from(ipmsStageHistory)
    .where(eq(ipmsStageHistory.projectId, projectId))
    .orderBy(ipmsStageHistory.createdAt);
  return items;
}

export async function dbAddIpmsStageHistory(values: {
  projectId: string;
  stage: string;
  status?: string;
  startedAt?: Date | null;
  completedAt?: Date | null;
  notes?: string | null;
  deliverables?: string[];
}) {
  const db = getDb();
  const [result] = await db.insert(ipmsStageHistory).values({
    projectId: values.projectId,
    stage: values.stage as any,
    status: (values.status as any) ?? "pending",
    startedAt: values.startedAt ?? null,
    completedAt: values.completedAt ?? null,
    notes: values.notes ?? null,
    deliverables: values.deliverables ?? [],
  } as any);
  return { insertId: Number(result.insertId) };
}

export async function dbUpdateIpmsStageHistory(id: number, values: Partial<{
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  deliverables: string[];
}>) {
  const db = getDb();
  await db.update(ipmsStageHistory)
    .set({
      ...values,
      status: values.status as any,
    } as any)
    .where(eq(ipmsStageHistory.id, id));
  return { success: true };
}
