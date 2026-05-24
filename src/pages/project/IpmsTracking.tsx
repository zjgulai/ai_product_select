/* eslint-disable @typescript-eslint/no-explicit-any */n
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import { LC } from '@/lib/lute-colors';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase, Plus, Calendar, Zap, CheckCircle, ChevronRight
} from 'lucide-react';

const STAGES = ['charter', 'concept', 'plan', 'develop', 'qualify', 'launch'] as const;
const STAGE_LABELS: Record<string, string> = {
  charter: 'Charter', concept: 'Concept', plan: 'Plan',
  develop: 'Develop', qualify: 'Qualify', launch: 'Launch',
};
const STAGE_COLORS: Record<string, string> = {
  charter: LC.primary,      // #E8785A
  concept: '#D49450',       // 品牌金色
  plan: '#C8A265',          // 暖色过渡
  develop: LC.teal,         // #2A9D8F
  qualify: LC.success,      // #4CAF50
  launch: LC.warning,       // #F4A261
};

function StageProgress({ currentStage }: { currentStage: string }) {
  const idx = STAGES.indexOf(currentStage as any);
  return (
    <div className="flex items-center gap-0.5">
      {STAGES.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className="w-4 h-1.5 rounded-sm"
            style={{
              background: i <= idx ? STAGE_COLORS[s] : LC.border,
              opacity: i <= idx ? 1 : 0.3,
            }}
            title={STAGE_LABELS[s]}
          />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, [string, string, string]> = {
    active: [LC.successLight, LC.success, '进行中'],
    paused: [LC.warningLight, LC.warning, '已暂停'],
    completed: [`${LC.primary}15`, LC.primary, '已完成'],
    cancelled: [LC.dangerLight, LC.danger, '已取消'],
  };
  const [bg, color, label] = m[status] ?? m.active;
  return <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: bg, color }}>{label}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const m: Record<string, [string, string]> = {
    high: [LC.dangerLight, LC.danger],
    medium: [LC.warningLight, LC.warning],
    low: [LC.successLight, LC.success],
  };
  const [bg, color] = m[priority] ?? m.medium;
  return <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: bg, color }}>{priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}</span>;
}

export default function IpmsTracking() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const { data, isLoading } = trpc.ipms.list.useQuery(
    { status: filter === 'all' ? undefined : filter, limit: 50 },
    { staleTime: 30_000 }
  );

  const createProject = trpc.ipms.create.useMutation({
    onSuccess: (res) => {
      navigate(`/project/${res.projectId}`);
    },
  });

  const projects = data?.items || [];
  const stats = {
    total: projects.length,
    active: projects.filter((p: any) => p.status === 'active').length,
    completed: projects.filter((p: any) => p.status === 'completed').length,
    upcoming: projects.filter((p: any) => p.status === 'active' && p.targetLaunchDate).length,
  };

  const handleCreate = () => {
    const name = prompt('输入项目名称:');
    if (!name) return;
    createProject.mutate({
      projectName: name,
      description: '',
      priority: 'medium',
      targetLaunchDate: undefined,
    });
  };

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={["决策执行", "项目跟踪"]} />

      {/* Header */}
      <div className="rounded-xl p-5 mb-4 ring-1 ring-lc-border/60" style={{ background: `linear-gradient(135deg, ${LC.primary} 0%, ${LC.primaryDark} 100%)` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Briefcase size={20} style={{ color: LC.textInverse }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: LC.textInverse }}>IPMS 项目跟踪</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Charter → Concept → Plan → Develop → Qualify → Launch</p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={createProject.isPending}
            className="flex items-center gap-1.5 text-xs px-4 h-8 rounded-md font-medium transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.15)', color: LC.textInverse }}
          >
            <Plus size={12} /> {createProject.isPending ? '创建中...' : '新建项目'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: '总项目', value: stats.total, icon: Briefcase, color: LC.primary },
          { label: '进行中', value: stats.active, icon: Zap, color: LC.success },
          { label: '已完成', value: stats.completed, icon: CheckCircle, color: LC.teal },
          { label: '即将上线', value: stats.upcoming, icon: Calendar, color: LC.warning },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg p-3 ring-1 ring-lc-border/60 shadow-lc">
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon size={13} style={{ color: s.color }} />
              <span className="text-xs text-lc-text-muted">{s.label}</span>
            </div>
            <div className="text-xl font-bold font-mono-num text-lc-text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lc p-3 mb-3 ring-1 ring-lc-border/60">
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: '全部' },
            { key: 'active', label: '进行中' },
            { key: 'completed', label: '已完成' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-3 h-7 rounded-md text-[11px] font-medium transition-all ${
                filter === f.key ? 'bg-lc-primary text-white' : 'bg-lc-bg-warm text-lc-text-secondary hover:bg-lc-border-light'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-lc overflow-hidden ring-1 ring-lc-border/60">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-lc-bg-warm">
                {['项目名称', '当前阶段', '状态', '优先级', '负责人', '目标日期', '操作'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-[11px] font-bold text-lc-text-secondary text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p: any) => (
                <tr
                  key={p.projectId}
                  className="border-b border-lc-border-light hover:bg-lc-bg-warm transition-colors cursor-pointer"
                  onClick={() => navigate(`/project/${p.projectId}`)}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ background: LC.primaryLight, color: LC.primary }}>
                        {(p.projectName ?? '?')[0]}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-lc-text-primary">{p.projectName}</div>
                        <div className="text-xs text-lc-text-muted truncate max-w-[180px]">{p.description || '暂无描述'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <StageProgress currentStage={p.currentStage} />
                      <span className="text-xs text-lc-text-muted">{STAGE_LABELS[p.currentStage] || p.currentStage}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-3"><PriorityBadge priority={p.priority} /></td>
                  <td className="py-3 px-3 text-xs text-lc-text-primary">{p.owner || '未分配'}</td>
                  <td className="py-3 px-3 text-xs text-lc-text-muted">{p.targetLaunchDate || '-'}</td>
                  <td className="py-3 px-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/project/${p.projectId}`); }}
                      className="text-xs px-2 h-5 rounded border transition-colors flex items-center gap-0.5"
                      style={{ borderColor: LC.border, color: LC.textSecondary }}
                    >
                      查看 <ChevronRight size={9} />
                    </button>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase size={28} className="text-lc-border" />
                      <p className="text-sm font-medium text-lc-text-muted">暂无项目</p>
                      <button
                        onClick={handleCreate}
                        className="mt-1 text-xs px-3 py-1 rounded-full bg-lc-primary text-white font-medium"
                      >
                        创建首个项目
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
