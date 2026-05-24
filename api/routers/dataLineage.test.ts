import { describe, it, expect } from "vitest";
import { appRouter } from "../router";

const caller = appRouter.createCaller({
  req: new Request("http://localhost/api/trpc"),
  resHeaders: new Headers(),
});

describe("dataLineage router", () => {
  it("stats 返回完整统计", async () => {
    const result = await caller.dataLineage.stats();
    expect(result.totalModules).toBeGreaterThan(0);
    expect(result.totalEndpoints).toBeGreaterThan(0);
    expect(result.totalEntities).toBeGreaterThan(0);
    expect(result.coverageRate).toBeGreaterThan(0);
    expect(result.modelsAvailable).toBeGreaterThan(0);
  });

  it("modules 返回模块列表", async () => {
    const result = await caller.dataLineage.modules();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("moduleId");
    expect(result[0]).toHaveProperty("pageName");
    expect(result[0]).toHaveProperty("gapCount");
  });

  it("moduleDetail 返回模块详情", async () => {
    const modules = await caller.dataLineage.modules();
    const detail = await caller.dataLineage.moduleDetail({ moduleId: modules[0].moduleId });
    expect(detail).not.toBeNull();
    expect(detail!.module).toBeDefined();
    expect(detail!.endpoints).toBeDefined();
    expect(detail!.healthScore).toBeGreaterThanOrEqual(0);
    expect(detail!.healthScore).toBeLessThanOrEqual(100);
  });

  it("gaps 返回数据缺口列表", async () => {
    const result = await caller.dataLineage.gaps();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("gapId");
      expect(result[0]).toHaveProperty("severity");
      expect(result[0]).toHaveProperty("description");
    }
  });

  it("gaps 支持 severity 过滤", async () => {
    const critical = await caller.dataLineage.gaps({ severity: "critical" });
    expect(Array.isArray(critical)).toBe(true);
    critical.forEach(g => expect(g.severity).toBe("critical"));
  });

  it("entities 返回数据实体列表", async () => {
    const result = await caller.dataLineage.entities();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("entityId");
    expect(result[0]).toHaveProperty("layer");
  });

  it("calcModels 返回测算模型列表", async () => {
    const result = await caller.dataLineage.calcModels();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("modelId");
    expect(result[0]).toHaveProperty("formula");
    expect(result[0]).toHaveProperty("confidence");
  });

  it("calcModelDetail 返回模型详情", async () => {
    const models = await caller.dataLineage.calcModels();
    const detail = await caller.dataLineage.calcModelDetail({ modelId: models[0].modelId });
    expect(detail).not.toBeNull();
    expect(detail!.model).toBeDefined();
    expect(detail!.relatedGaps).toBeDefined();
  });

  it("runCalculation 执行测算", async () => {
    const models = await caller.dataLineage.calcModels();
    const result = await caller.dataLineage.runCalculation({
      modelId: models[0].modelId,
      inputs: { a: 10, b: 20, c: 30 },
    });
    expect(result).toHaveProperty("result");
    expect(typeof result.result).toBe("number");
    expect(result).toHaveProperty("confidence");
  });

  it("fullGraph 返回血缘图谱", async () => {
    const result = await caller.dataLineage.fullGraph();
    expect(result).toHaveProperty("nodes");
    expect(result).toHaveProperty("edges");
    expect(Array.isArray(result.nodes)).toBe(true);
    expect(Array.isArray(result.edges)).toBe(true);
    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.edges.length).toBeGreaterThanOrEqual(0);
  });

  it("searchExternalSources 返回搜索建议", async () => {
    const gaps = await caller.dataLineage.gaps();
    if (gaps.length > 0) {
      const result = await caller.dataLineage.searchExternalSources({ gapId: gaps[0].gapId });
      expect(result).toHaveProperty("gapId");
      expect(result).toHaveProperty("searchResults");
      expect(Array.isArray(result.searchResults)).toBe(true);
    }
  });
});
