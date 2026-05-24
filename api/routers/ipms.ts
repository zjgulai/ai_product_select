import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import {
  dbGetIpmsProjects, dbGetIpmsProjectById,
  dbCreateIpmsProject, dbUpdateIpmsProject, dbDeleteIpmsProject,
  dbGetIpmsStageHistory, dbAddIpmsStageHistory,
} from "../services/db";

async function withFallback<T>(dbFn: () => Promise<T>, mockFn: () => unknown): Promise<T> {
  try {
    return await dbFn();
  } catch (err) {
    console.error('[DB Fallback][ipms]', err);
    return mockFn() as T;
  }
}

export const ipmsRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        status: z.enum(["active", "paused", "completed", "cancelled"]).optional(),
        priority: z.enum(["high", "medium", "low"]).optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      return await withFallback(
        () => dbGetIpmsProjects({
          status: input?.status,
          priority: input?.priority,
          limit: input?.limit,
          offset: input?.offset,
        }),
        () => ({ items: [], total: 0 })
      );
    }),

  getById: publicQuery
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const project = await withFallback(
        () => dbGetIpmsProjectById(input.projectId),
        () => null
      );
      if (!project) return null;
      const history = await withFallback(
        () => dbGetIpmsStageHistory(input.projectId),
        () => []
      );
      return { ...project, history };
    }),

  create: publicQuery
    .input(z.object({
      conceptId: z.string().optional(),
      projectName: z.string().min(1),
      description: z.string().optional(),
      currentStage: z.enum(["charter", "concept", "plan", "develop", "qualify", "launch"]).optional(),
      status: z.enum(["active", "paused", "completed", "cancelled"]).optional(),
      priority: z.enum(["high", "medium", "low"]).optional(),
      owner: z.string().optional(),
      targetLaunchDate: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      const projectId = `IPMS_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const result = await withFallback(
        () => dbCreateIpmsProject({ ...input, projectId }),
        () => ({ insertId: 0 })
      );
      // Add initial stage history
      await withFallback(
        () => dbAddIpmsStageHistory({
          projectId,
          stage: input.currentStage ?? 'charter',
          status: 'in_progress',
          notes: '项目创建',
          startedAt: new Date(),
        }),
        () => ({ insertId: 0 })
      );
      return { insertId: result.insertId, projectId };
    }),

  updateStage: publicQuery
    .input(z.object({
      projectId: z.string(),
      stage: z.enum(["charter", "concept", "plan", "develop", "qualify", "launch"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Update project current stage
      await withFallback(
        () => dbUpdateIpmsProject(input.projectId, { currentStage: input.stage }),
        () => ({ success: true })
      );
      // Add stage history record
      await withFallback(
        () => dbAddIpmsStageHistory({
          projectId: input.projectId,
          stage: input.stage,
          status: 'in_progress',
          notes: input.notes || `进入 ${input.stage} 阶段`,
          startedAt: new Date(),
        }),
        () => ({ insertId: 0 })
      );
      return { success: true };
    }),

  updateStatus: publicQuery
    .input(z.object({
      projectId: z.string(),
      status: z.enum(["active", "paused", "completed", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const { projectId, status } = input;
      return await withFallback(
        () => dbUpdateIpmsProject(projectId, { status }),
        () => ({ success: true })
      );
    }),

  addStageHistory: publicQuery
    .input(z.object({
      projectId: z.string(),
      stage: z.enum(["charter", "concept", "plan", "develop", "qualify", "launch"]),
      status: z.enum(["pending", "in_progress", "completed", "skipped"]).optional(),
      startedAt: z.string().optional(),
      completedAt: z.string().optional(),
      notes: z.string().optional(),
      deliverables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return await withFallback(
        () => dbAddIpmsStageHistory({
          ...input,
          startedAt: input.startedAt ? new Date(input.startedAt) : null,
          completedAt: input.completedAt ? new Date(input.completedAt) : null,
        }),
        () => ({ insertId: 0 })
      );
    }),

  delete: publicQuery
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      return await withFallback(
        () => dbDeleteIpmsProject(input.projectId),
        () => ({ success: true })
      );
    }),
});
