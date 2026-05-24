import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import {
  PAGE_MODULES,
  API_ENDPOINTS,
  DATA_ENTITIES,
  DATA_GAPS,
  CALCULATION_MODELS,
  getEntityById,
  getEndpointById,
  getModuleById,
  getGapsByModule,
  getGapsBySeverity,
  getEndpointsForModule,
  getEntitiesForEndpoint,
  getCalcModelById,
  getLineageStats,
  getModulesForEntity,
} from "../services/data-lineage";

// ── 数据血缘 Router ───────────────────────────────────────────────────────

export const dataLineageRouter = createRouter({
  // 获取完整数据血缘统计
  stats: publicQuery.query(() => {
    return getLineageStats();
  }),

  // 获取所有页面模块
  modules: publicQuery.query(() => {
    return PAGE_MODULES.map(m => ({
      ...m,
      endpointCount: m.endpoints.length,
      gapCount: getGapsByModule(m.moduleId).length,
      hasCriticalGap: getGapsByModule(m.moduleId).some(g => g.severity === "critical"),
    }));
  }),

  // 获取模块详情（含端点、实体、缺口）
  moduleDetail: publicQuery
    .input(z.object({ moduleId: z.string() }))
    .query(({ input }) => {
      const module = getModuleById(input.moduleId);
      if (!module) return null;

      const endpoints = getEndpointsForModule(module).map(ep => ({
        ...ep,
        entities: getEntitiesForEndpoint(ep).map(e => ({
          entityId: e.entityId,
          entityName: e.entityName,
          layer: e.layer,
          tableName: e.tableName,
          sourceType: e.sourceType,
          sourceName: e.sourceName,
        })),
      }));

      const gaps = getGapsByModule(input.moduleId);
      const relatedEntities = Array.from(
        new Set(endpoints.flatMap(ep => ep.entities.map(e => e.entityId)))
      ).map(id => getEntityById(id)).filter(Boolean);

      return {
        module,
        endpoints,
        gaps,
        relatedEntities,
        healthScore: Math.max(0, 100 - gaps.filter(g => g.severity === "critical").length * 30 - gaps.filter(g => g.severity === "warning").length * 15),
      };
    }),

  // 获取所有数据缺口
  gaps: publicQuery
    .input(z.object({
      severity: z.enum(["critical", "warning", "info"]).optional(),
      moduleId: z.string().optional(),
    }).optional())
    .query(({ input }) => {
      let gaps = DATA_GAPS;
      if (input?.severity) gaps = getGapsBySeverity(input.severity);
      if (input?.moduleId) gaps = gaps.filter(g => g.moduleId === input.moduleId);

      return gaps.map(g => {
        const module = getModuleById(g.moduleId);
        const endpoint = getEndpointById(g.endpointId);
        const entity = g.entityId ? getEntityById(g.entityId) : undefined;
        const model = g.calcModel ? getCalcModelById(g.calcModel) : undefined;
        return {
          ...g,
          moduleName: module?.pageName ?? g.moduleId,
          modulePath: module?.pagePath,
          endpointPath: endpoint?.fullPath,
          entityName: entity?.entityName,
          entityLayer: entity?.layer,
          calcModelName: model?.modelName,
          calcModelFormula: model?.formula,
        };
      });
    }),

  // 获取所有数据实体
  entities: publicQuery
    .input(z.object({
      layer: z.enum(["ODS", "DWD", "DWS", "ADS", "Mock", "External"]).optional(),
    }).optional())
    .query(({ input }) => {
      let entities = DATA_ENTITIES;
      if (input?.layer) entities = entities.filter(e => e.layer === input.layer);

      return entities.map(e => ({
        ...e,
        moduleCount: getModulesForEntity(e.entityId).length,
      }));
    }),

  // 获取实体详情
  entityDetail: publicQuery
    .input(z.object({ entityId: z.string() }))
    .query(({ input }) => {
      const entity = getEntityById(input.entityId);
      if (!entity) return null;

      const endpoints = API_ENDPOINTS.filter(ep => ep.entities.includes(input.entityId));
      const modules = getModulesForEntity(input.entityId);
      const gaps = DATA_GAPS.filter(g => g.entityId === input.entityId);

      return { entity, endpoints, modules, gaps };
    }),

  // 获取测算模型列表
  calcModels: publicQuery.query(() => {
    return CALCULATION_MODELS;
  }),

  // 获取测算模型详情
  calcModelDetail: publicQuery
    .input(z.object({ modelId: z.string() }))
    .query(({ input }) => {
      const model = getCalcModelById(input.modelId);
      if (!model) return null;

      // 找到使用该模型的缺口
      const relatedGaps = DATA_GAPS.filter(g => g.calcModel === input.modelId);

      return { model, relatedGaps };
    }),

  // 执行测算（模拟）
  runCalculation: publicQuery
    .input(z.object({
      modelId: z.string(),
      inputs: z.record(z.string(), z.number()),
    }))
    .query(({ input }) => {
      const model = getCalcModelById(input.modelId);
      if (!model) return { error: "Model not found" };

      // 简单的模拟计算
      const vals = Object.values(input.inputs);
      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = vals.length > 0 ? sum / vals.length : 0;

      let result = 0;
      switch (model.modelType) {
        case "index_composite":
          result = Math.min(100, Math.max(0, avg * (1 + Math.random() * 0.2)));
          break;
        case "regression":
          result = avg * (0.8 + Math.random() * 0.4);
          break;
        case "market_sizing":
          result = sum * 12 * (1 + Math.random() * 0.5);
          break;
        case "sentiment_analysis":
          result = Math.min(100, Math.max(0, 50 + (avg - 3) * 25));
          break;
        case "trend_forecast":
          result = avg * (1 + (Math.random() - 0.3) * 0.3);
          break;
        default:
          result = avg;
      }

      return {
        modelId: model.modelId,
        modelName: model.modelName,
        inputs: input.inputs,
        result: parseFloat(result.toFixed(2)),
        confidence: model.confidence,
        formula: model.formula,
        note: `基于${model.verifiedBy}验证的${model.industryStandard}进行测算`,
      };
    }),

  // 搜索外部数据源补全建议
  searchExternalSources: publicQuery
    .input(z.object({ gapId: z.string() }))
    .query(({ input }) => {
      const gap = DATA_GAPS.find(g => g.gapId === input.gapId);
      if (!gap) return { error: "Gap not found" };

      // 模拟深度搜索结果
      const searchResults = gap.externalSources?.map(src => ({
        ...src,
        estimatedCost: Math.floor(Math.random() * 5000 + 500),
        integrationComplexity: ["低", "中", "高"][Math.floor(Math.random() * 3)] as "低" | "中" | "高",
        dataCoverage: ["全球", "北美", "欧洲", "东南亚"][Math.floor(Math.random() * 4)],
        apiAvailability: Math.random() > 0.3,
        sampleDataAvailable: Math.random() > 0.5,
      })) ?? [];

      // 如果无预配置外部源，生成通用搜索建议
      if (searchResults.length === 0) {
        const genericSources = [
          { name: "SimilarWeb电商数据", url: "https://www.similarweb.com/", reliability: 0.80, estimatedCost: 2000, integrationComplexity: "中" as const, dataCoverage: "全球", apiAvailability: true, sampleDataAvailable: true },
          { name: "Statista市场数据", url: "https://www.statista.com/", reliability: 0.90, estimatedCost: 3000, integrationComplexity: "低" as const, dataCoverage: "全球", apiAvailability: true, sampleDataAvailable: true },
          { name: "Euromonitor行业报告", url: "https://www.euromonitor.com/", reliability: 0.92, estimatedCost: 5000, integrationComplexity: "高" as const, dataCoverage: "全球", apiAvailability: false, sampleDataAvailable: true },
        ];
        searchResults.push(...genericSources);
      }

      return {
        gapId: gap.gapId,
        gapDescription: gap.description,
        searchResults,
        recommendation: searchResults.length > 0
          ? `推荐使用 ${searchResults[0].name} (可信度${Math.round(searchResults[0].reliability * 100)}%)`
          : "建议通过内部数据采集补全",
      };
    }),

  // 获取完整血缘图谱（用于可视化）
  fullGraph: publicQuery.query(() => {
    const nodes: Array<{
      id: string;
      type: "module" | "endpoint" | "entity";
      label: string;
      category?: string;
      layer?: string;
      sourceType?: string;
      hasGap?: boolean;
    }> = [];
    const edges: Array<{ source: string; target: string }> = [];

    // Module nodes
    PAGE_MODULES.forEach(m => {
      nodes.push({
        id: m.moduleId,
        type: "module",
        label: m.pageName,
        category: m.category,
        hasGap: getGapsByModule(m.moduleId).length > 0,
      });
    });

    // Endpoint nodes + edges from modules
    API_ENDPOINTS.forEach(ep => {
      nodes.push({
        id: ep.endpointId,
        type: "endpoint",
        label: ep.procedure,
        hasGap: ep.isFallbackToMock,
      });
      // Find modules that use this endpoint
      PAGE_MODULES.filter(m => m.endpoints.includes(ep.endpointId)).forEach(m => {
        edges.push({ source: m.moduleId, target: ep.endpointId });
      });
    });

    // Entity nodes + edges from endpoints
    DATA_ENTITIES.forEach(e => {
      nodes.push({
        id: e.entityId,
        type: "entity",
        label: e.entityName,
        layer: e.layer,
        sourceType: e.sourceType,
        hasGap: e.sourceType === "mock",
      });
      API_ENDPOINTS.filter(ep => ep.entities.includes(e.entityId)).forEach(ep => {
        edges.push({ source: ep.endpointId, target: e.entityId });
      });
    });

    return { nodes, edges };
  }),
});
