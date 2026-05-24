import { useState } from 'react';
import { trpc } from '@/providers/trpc';
import { LC } from '@/lib/lute-colors';
import LineageStatsCards from './LineageStatsCards';
import ModuleList from './ModuleList';
import ModuleDetail from './ModuleDetail';
import GapDetailPanel from './GapDetailPanel';
import EntityFlow from './EntityFlow';
import CalcModelsPanel from './CalcModelsPanel';
import { Network, List, AlertTriangle, BarChart3 } from 'lucide-react';

type SubTab = 'modules' | 'flow' | 'gaps' | 'models';

export default function LineagePanel() {
  const [subTab, setSubTab] = useState<SubTab>('modules');
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>();
  const [selectedGapId, setSelectedGapId] = useState<string | undefined>();

  const { data: stats, isLoading: statsLoading } = trpc.dataLineage.stats.useQuery();
  const { data: modules, isLoading: modulesLoading } = trpc.dataLineage.modules.useQuery();
  const { data: moduleDetail } = trpc.dataLineage.moduleDetail.useQuery(
    { moduleId: selectedModuleId ?? '' },
    { enabled: !!selectedModuleId && subTab === 'modules' }
  );
  const { data: allGaps, isLoading: gapsLoading } = trpc.dataLineage.gaps.useQuery();
  const { data: graphData, isLoading: graphLoading } = trpc.dataLineage.fullGraph.useQuery();
  const { data: calcModels, isLoading: modelsLoading } = trpc.dataLineage.calcModels.useQuery();

  const selectedGap = selectedGapId ? allGaps?.find(g => g.gapId === selectedGapId) : undefined;

  const tabs: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    { key: 'modules', label: '模块血缘', icon: <List size={13} /> },
    { key: 'flow', label: '血缘图谱', icon: <Network size={13} /> },
    { key: 'gaps', label: '数据缺口', icon: <AlertTriangle size={13} /> },
    { key: 'models', label: '测算模型', icon: <BarChart3 size={13} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <LineageStatsCards stats={stats} loading={statsLoading} />

      {/* Sub Tabs */}
      <div className="flex gap-4 border-b border-lc-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setSubTab(t.key); setSelectedModuleId(undefined); setSelectedGapId(undefined); }}
            className="flex items-center gap-1 pb-2 text-xs font-medium transition-all border-b-2"
            style={subTab === t.key ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {subTab === 'modules' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <ModuleList
              modules={modules}
              selectedId={selectedModuleId}
              onSelect={(id) => { setSelectedModuleId(id); setSelectedGapId(undefined); }}
              loading={modulesLoading}
            />
          </div>
          <div className="col-span-2">
            {selectedGapId && selectedGap ? (
              <GapDetailPanel
                gap={selectedGap}
                onBack={() => setSelectedGapId(undefined)}
              />
            ) : (
              <ModuleDetail
                data={moduleDetail ?? undefined}
                onGapClick={(gapId) => setSelectedGapId(gapId)}
              />
            )}
          </div>
        </div>
      )}

      {subTab === 'flow' && (
        <EntityFlow
          nodes={graphData?.nodes}
          edges={graphData?.edges}
          loading={graphLoading}
        />
      )}

      {subTab === 'gaps' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: LC.dangerLight, color: LC.danger }}>
              严重 {allGaps?.filter(g => g.severity === 'critical').length ?? 0}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: LC.warningLight, color: LC.warning }}>
              警告 {allGaps?.filter(g => g.severity === 'warning').length ?? 0}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: `${LC.teal}15`, color: LC.teal }}>
              提示 {allGaps?.filter(g => g.severity === 'info').length ?? 0}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {gapsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 rounded-lg bg-lc-bg-warm animate-pulse" />
              ))
            ) : allGaps?.map(gap => {
              const sevColors = {
                critical: { color: LC.danger, bg: LC.dangerLight },
                warning: { color: LC.warning, bg: LC.warningLight },
                info: { color: LC.teal, bg: `${LC.teal}15` },
              };
              const sev = sevColors[gap.severity];
              return (
                <div
                  key={gap.gapId}
                  className="rounded-lg p-3 border cursor-pointer transition-all hover:shadow-lc-hover"
                  style={{ borderColor: sev.color, background: sev.bg }}
                  onClick={() => { setSelectedGapId(gap.gapId); setSubTab('modules'); }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: sev.color + '20', color: sev.color }}>
                      {gap.severity === 'critical' ? '严重' : gap.severity === 'warning' ? '警告' : '提示'}
                    </span>
                    <span className="text-[9px] text-lc-text-muted">{gap.gapId}</span>
                  </div>
                  <p className="text-xs font-medium text-lc-text-primary mb-1">{gap.description}</p>
                  <p className="text-[9px] text-lc-text-secondary mb-1">{gap.impact}</p>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-lc-text-muted">模块: {gap.moduleName}</span>
                    {gap.calcModelName && (
                      <span style={{ color: LC.primary }}>模型: {gap.calcModelName}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'models' && (
        <CalcModelsPanel models={calcModels} loading={modelsLoading} />
      )}
    </div>
  );
}
