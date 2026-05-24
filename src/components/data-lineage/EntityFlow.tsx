import { Database, ArrowRight } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

interface FlowNode {
  id: string;
  type: 'module' | 'endpoint' | 'entity';
  label: string;
  layer?: string;
  sourceType?: string;
  hasGap?: boolean;
}

interface FlowEdge {
  source: string;
  target: string;
}

export default function EntityFlow({ nodes, edges, loading }: {
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-lc-text-muted">
        <div className="w-4 h-4 border-2 border-lc-primary border-t-transparent rounded-full animate-spin mr-2" />
        加载血缘图谱...
      </div>
    );
  }

  if (!nodes || !edges) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-lc-text-muted">
        暂无血缘数据
      </div>
    );
  }

  // Build adjacency: module -> endpoints -> entities
  const moduleNodes = nodes.filter(n => n.type === 'module');
  const endpointNodes = nodes.filter(n => n.type === 'endpoint');
  const entityNodes = nodes.filter(n => n.type === 'entity');

  const layerColors: Record<string, string> = {
    ODS: '#6366F1',
    DWD: '#0891B2',
    DWS: '#059669',
    ADS: '#D97706',
    Mock: '#DC2626',
    External: '#7C3AED',
  };

  const sourceTypeLabels: Record<string, string> = {
    database: '数据库',
    api: 'API',
    scraping: '爬虫',
    manual: '人工',
    calculated: '测算',
    mock: '模拟',
    third_party: '第三方',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-lc-text-muted mb-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: LC.primary }} /> 页面模块</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: LC.teal }} /> API端点</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: LC.warning }} /> 数据实体</span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {moduleNodes.map(mod => {
          // Find endpoints connected to this module
          const modEndpointIds = new Set(
            edges.filter(e => e.source === mod.id).map(e => e.target)
          );
          const modEndpoints = endpointNodes.filter(ep => modEndpointIds.has(ep.id));

          return (
            <div key={mod.id} className="rounded-lg border p-3" style={{ borderColor: mod.hasGap ? LC.danger : LC.border }}>
              {/* Module */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: LC.primary }} />
                <span className="text-xs font-semibold text-lc-text-primary">{mod.label}</span>
                {mod.hasGap && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: LC.dangerLight, color: LC.danger }}>
                    有缺口
                  </span>
                )}
              </div>

              {/* Endpoints */}
              <div className="ml-4 space-y-2">
                {modEndpoints.map(ep => {
                  const epEntityIds = new Set(
                    edges.filter(e => e.source === ep.id).map(e => e.target)
                  );
                  const epEntities = entityNodes.filter(ent => epEntityIds.has(ent.id));

                  return (
                    <div key={ep.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <ArrowRight size={10} className="text-lc-text-muted" />
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: LC.teal }} />
                        <code className="text-xs font-mono text-lc-text-secondary">{ep.label}</code>
                        {ep.hasGap && (
                          <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: LC.warningLight, color: LC.warning }}>
                            Mock
                          </span>
                        )}
                      </div>

                      {/* Entities */}
                      <div className="ml-5 flex flex-wrap gap-1.5">
                        {epEntities.map(ent => (
                          <span
                            key={ent.id}
                            className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1"
                            style={{
                              background: `${layerColors[ent.layer ?? ''] ?? LC.primary}12`,
                              color: layerColors[ent.layer ?? ''] ?? LC.primary,
                              border: ent.hasGap ? `1px solid ${LC.danger}` : 'none',
                            }}
                          >
                            <Database size={8} />
                            {ent.label}
                            {ent.layer && <span className="opacity-60">({ent.layer})</span>}
                            {ent.sourceType && (
                              <span className="opacity-60">{sourceTypeLabels[ent.sourceType] ?? ent.sourceType}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
