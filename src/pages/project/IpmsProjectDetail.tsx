/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import { LC } from '@/lib/lute-colors';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog, useConfirm } from '@/components/shared/ConfirmDialog';
import {
  Briefcase, ChevronLeft, Clock, User, Calendar, Flag,
  ArrowRight, CheckCircle2, Circle, FileText
} from 'lucide-react';

const STAGES = ['charter', 'concept', 'plan', 'develop', 'qualify', 'launch'] as const;
const STAGE_LABELS: Record<string, string> = {
  charter: 'Charter', concept: 'Concept', plan: 'Plan',
  develop: 'Develop', qualify: 'Qualify', launch: 'Launch',
};
const STAGE_DESC: Record<string, string> = {
  charter: '项目立项与目标定义',
  concept: '概念验证与需求分析',
  plan: '详细计划与资源分配',
  develop: '产品开发与迭代',
  qualify: '质量验证与测试',
  launch: '上线发布与推广',
};
const STAGE_COLORS: Record<string, string> = {
  charter: LC.primary,
  concept: LC.gold,
  plan: LC.warning,
  develop: LC.teal,
  qualify: LC.success,
  launch: LC.info,
};

const STATUS_LABELS: Record<string, string> = {
  active: '进行中', paused: '已暂停', completed: '已完成', cancelled: '已取消',
};
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: LC.successLight, color: LC.success },
  paused: { bg: LC.warningLight, color: LC.warning },
  completed: { bg: `${LC.info}15`, color: LC.info },
  cancelled: { bg: '#F5F5F4', color: LC.textSecondary },
};

const STAGE_STATUS_LABELS: Record<string, string> = {
  pending: '待开始', in_progress: '进行中', completed: '已完成', skipped: '已跳过',
};

export default function IpmsProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [historyNotes, setHistoryNotes] = useState('');
  const [historyDeliverables, setHistoryDeliverables] = useState('');
  const { open, setOpen, options, confirm, handleConfirm } = useConfirm();

  const { data, isLoading, refetch } = trpc.ipms.getById.useQuery(
    { projectId: id! },
    { enabled: !!id }
  );

  const updateStageMutation = trpc.ipms.updateStage.useMutation({ onSuccess: () => refetch() });
  const updateStatusMutation = trpc.ipms.updateStatus.useMutation({ onSuccess: () => refetch() });
  const addHistoryMutation = trpc.ipms.addStageHistory.useMutation({ onSuccess: () => { refetch(); setShowAddHistory(false); } });

  if (isLoading) {
    return (
      <div className="animate-fadeIn">
        <Breadcrumb items={['决策执行', '项目跟踪', '项目详情']} />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="animate-fadeIn">
        <Breadcrumb items={['决策执行', '项目跟踪', '项目详情']} />
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Briefcase size={40} className="text-lc-border" />
          <p className="text-sm font-medium text-lc-text-muted">项目不存在</p>
          <button
            onClick={() => navigate('/project/tracking')}
            className="text-xs px-4 h-7 rounded-full font-medium text-white"
            style={{ background: LC.primary }}
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const currentIdx = STAGES.indexOf(data.currentStage as any);
  const history = (data.history ?? []) as any[];

  const handleStageClick = async (stage: typeof STAGES[number]) => {
    const targetIdx = STAGES.indexOf(stage);
    if (targetIdx < currentIdx) {
      const ok = await confirm({
        title: '回退项目阶段',
        description: `确定要将项目回退到「${STAGE_LABELS[stage]}」阶段吗？此操作不可撤销，后续阶段的历史记录将保留但当前阶段会被重置。`,
        confirmText: '确认回退',
        cancelText: '取消',
        variant: 'warning',
      });
      if (!ok) return;
    }
    updateStageMutation.mutate({ projectId: data.projectId, stage });
  };

  const handleAddHistory = () => {
    addHistoryMutation.mutate({
      projectId: data.projectId,
      stage: data.currentStage,
      status: 'completed',
      notes: historyNotes.trim() || undefined,
      deliverables: historyDeliverables.split(',').map(s => s.trim()).filter(Boolean),
    });
    setHistoryNotes('');
    setHistoryDeliverables('');
  };

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={['决策执行', '项目跟踪', data.projectName]} />

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lc p-4 mb-4 ring-1 ring-lc-border/60" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FDF8F6 100%)', boxShadow: '0 10px 24px rgba(53,20,26,0.04)' }}>
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={() => navigate('/project/tracking')}
            className="flex items-center gap-1 text-[11px] text-lc-text-muted hover:text-lc-primary transition-colors"
          >
            <ChevronLeft size={14} /> 返回列表
          </button>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0" style={{ background: LC.primaryLight, color: LC.primary }}>
              {data.projectName?.[0] || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-lc-text">{data.projectName}</h1>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: STATUS_STYLES[data.status]?.bg || '#F5F5F4',
                    color: STATUS_STYLES[data.status]?.color || LC.textSecondary,
                  }}
                >
                  {STATUS_LABELS[data.status] || data.status}
                </span>
              </div>
              <div className="text-[11px] text-lc-text-muted mt-0.5">{data.projectId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.status === 'active' && (
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: '暂停项目',
                    description: '暂停后项目将停止推进，团队成员将无法继续提交阶段 deliverables。是否继续？',
                    confirmText: '确认暂停',
                    cancelText: '取消',
                    variant: 'warning',
                  });
                  if (ok) updateStatusMutation.mutate({ projectId: data.projectId, status: 'paused' });
                }}
                className="text-xs px-3 h-7 rounded-full font-medium border transition-all"
                style={{ borderColor: `${LC.warning}40`, color: LC.warning, background: LC.warningLight }}
              >
                暂停项目
              </button>
            )}
            {data.status === 'paused' && (
              <button
                onClick={() => updateStatusMutation.mutate({ projectId: data.projectId, status: 'active' })}
                className="text-xs px-3 h-7 rounded-full font-medium text-white transition-all hover:brightness-110"
                style={{ background: LC.success }}
              >
                恢复项目
              </button>
            )}
            {data.status !== 'completed' && (
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: '标记项目完成',
                    description: '项目标记完成后将进入归档状态，不可再进行阶段推进。请确认所有 deliverables 已验收。',
                    confirmText: '确认完成',
                    cancelText: '再检查',
                    variant: 'primary',
                  });
                  if (ok) updateStatusMutation.mutate({ projectId: data.projectId, status: 'completed' });
                }}
                className="text-xs px-3 h-7 rounded-full font-medium text-white transition-all hover:brightness-110"
                style={{ background: LC.info }}
              >
                标记完成
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-lc-border-light">
          <div className="flex items-center gap-2">
            <User size={14} className="text-lc-text-muted" />
            <div>
              <div className="text-xs text-lc-text-muted">负责人</div>
              <div className="text-xs font-medium text-lc-text-primary">{data.owner || '未分配'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flag size={14} className="text-lc-text-muted" />
            <div>
              <div className="text-xs text-lc-text-muted">优先级</div>
              <div className="text-xs font-medium text-lc-text-primary">{data.priority === 'high' ? '高' : data.priority === 'medium' ? '中' : '低'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-lc-text-muted" />
            <div>
              <div className="text-xs text-lc-text-muted">目标上线日期</div>
              <div className="text-xs font-medium text-lc-text-primary">{data.targetLaunchDate ? String(data.targetLaunchDate) : '未设置'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-lc-text-muted" />
            <div>
              <div className="text-xs text-lc-text-muted">创建时间</div>
              <div className="text-xs font-medium text-lc-text-primary">
                {data.createdAt ? new Date(data.createdAt).toLocaleDateString('zh-CN') : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Timeline */}
      <div className="bg-white rounded-xl shadow-lc p-4 mb-4 ring-1 ring-lc-border/60" style={{ boxShadow: '0 10px 24px rgba(53,20,26,0.04)' }}>
        <h3 className="text-sm font-semibold text-lc-primary mb-4">IPMS 阶段流程</h3>
        <div className="flex items-center justify-between">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const stageHistory = history.find((h: any) => h.stage === stage);
            return (
              <div key={stage} className="flex items-center flex-1">
                <button
                  onClick={() => handleStageClick(stage)}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isCompleted || isCurrent ? STAGE_COLORS[stage] : '#F5F5F4',
                      color: isCompleted || isCurrent ? '#fff' : LC.textMuted,
                      boxShadow: isCurrent ? `0 0 0 4px ${STAGE_COLORS[stage]}20` : 'none',
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : isCurrent ? <ArrowRight size={16} /> : <Circle size={16} />}
                  </div>
                  <div className="text-center">
                    <div
                      className="text-[11px] font-semibold transition-colors"
                      style={{ color: isCompleted || isCurrent ? STAGE_COLORS[stage] : LC.textMuted }}
                    >
                      {STAGE_LABELS[stage]}
                    </div>
                    <div className="text-[9px] text-lc-text-muted max-w-[70px] leading-tight">{STAGE_DESC[stage]}</div>
                    {stageHistory && (
                      <div
                        className="text-[9px] font-medium mt-0.5"
                        style={{ color: STAGE_COLORS[stage] }}
                      >
                        {STAGE_STATUS_LABELS[stageHistory.status] || stageHistory.status}
                      </div>
                    )}
                  </div>
                </button>
                {idx < STAGES.length - 1 && (
                  <div className="flex-1 h-[2px] mx-1 rounded-full" style={{ background: isCompleted ? STAGE_COLORS[stage] : LC.border }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Stage Info */}
        <div className="bg-white rounded-xl shadow-lc p-4 ring-1 ring-lc-border/60" style={{ boxShadow: '0 10px 24px rgba(53,20,26,0.04)' }}>
          <h3 className="text-sm font-semibold text-lc-primary mb-3">当前阶段详情</h3>
          <div
            className="rounded-xl p-4 mb-3"
            style={{ background: `${STAGE_COLORS[data.currentStage]}08`, border: `1px solid ${STAGE_COLORS[data.currentStage]}20` }}
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: STAGE_COLORS[data.currentStage] }}>
                {currentIdx + 1}
              </div>
              <div className="text-sm font-bold" style={{ color: STAGE_COLORS[data.currentStage] }}>
                {STAGE_LABELS[data.currentStage]}阶段
              </div>
            </div>
            <p className="text-[11px] text-lc-text-secondary">{STAGE_DESC[data.currentStage]}</p>
          </div>
          {data.description && (
            <div className="mb-3">
              <div className="text-xs font-medium text-lc-text-muted mb-1">项目描述</div>
              <p className="text-xs text-lc-text-secondary leading-relaxed">{data.description}</p>
            </div>
          )}
          {data.conceptId && (
            <div className="mb-3">
              <div className="text-xs font-medium text-lc-text-muted mb-1">关联概念</div>
              <button
                onClick={() => navigate(`/fusion/concept/${data.conceptId}`)}
                className="text-xs font-medium text-lc-primary hover:underline flex items-center gap-1"
              >
                <FileText size={12} />
                {data.conceptId}
                <ArrowRight size={12} />
              </button>
            </div>
          )}
          {data.metadata && Object.keys(data.metadata).length > 0 && (
            <div>
              <div className="text-xs font-medium text-lc-text-muted mb-1">元数据</div>
              <div className="space-y-1">
                {Object.entries(data.metadata).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-4 text-[11px]">
                    <span className="text-lc-text-muted">{k}:</span>
                    <span className="text-lc-text-primary font-mono">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stage History */}
        <div className="bg-white rounded-xl shadow-lc p-4 ring-1 ring-lc-border/60" style={{ boxShadow: '0 10px 24px rgba(53,20,26,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-lc-primary">阶段历史记录</h3>
            <button
              onClick={() => setShowAddHistory(true)}
              className="text-xs px-2.5 h-6 rounded-full font-medium text-white transition-all hover:brightness-110"
              style={{ background: LC.primary }}
            >
              + 添加记录
            </button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-6">
                <Clock size={20} className="text-lc-border mx-auto mb-1" />
                <p className="text-[11px] text-lc-text-muted">暂无阶段历史记录</p>
              </div>
            ) : (
              history.map((h: any) => {
                const stageIdx = STAGES.indexOf(h.stage);
                return (
                  <div key={h.id} className="flex items-start gap-4 p-2.5 rounded-md" style={{ background: LC.bgWarm }}>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5"
                      style={{ background: STAGE_COLORS[h.stage] }}
                    >
                      {stageIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-lc-text-primary">{STAGE_LABELS[h.stage]}</span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: h.status === 'completed' ? LC.successLight : h.status === 'in_progress' ? `${LC.info}15` : '#F5F5F4',
                            color: h.status === 'completed' ? LC.success : h.status === 'in_progress' ? LC.info : LC.textSecondary,
                          }}
                        >
                          {STAGE_STATUS_LABELS[h.status] || h.status}
                        </span>
                      </div>
                      {h.notes && <p className="text-xs text-lc-text-secondary mt-0.5">{h.notes}</p>}
                      {h.deliverables && h.deliverables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {h.deliverables.map((d: string, i: number) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white text-lc-text-secondary border border-lc-border">{d}</span>
                          ))}
                        </div>
                      )}
                      <div className="text-[9px] text-lc-text-muted mt-1">
                        {h.startedAt && `开始: ${new Date(h.startedAt).toLocaleDateString('zh-CN')}`}
                        {h.completedAt && ` · 完成: ${new Date(h.completedAt).toLocaleDateString('zh-CN')}`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog open={open} onOpenChange={setOpen} options={options} onConfirm={handleConfirm} />

      {/* Add History Modal */}
      {showAddHistory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-sm font-bold text-lc-text mb-4">添加阶段记录</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-lc-text-secondary block mb-1">阶段</label>
                <div className="h-8 px-3 rounded-md border text-xs border-lc-border bg-lc-bg-warm flex items-center text-lc-text-primary">
                  {STAGE_LABELS[data.currentStage]}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-lc-text-secondary block mb-1">备注</label>
                <textarea
                  value={historyNotes}
                  onChange={e => setHistoryNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border text-xs border-lc-border focus:outline-none focus:ring-1 focus:ring-lc-primary resize-none"
                  rows={3}
                  placeholder="输入阶段备注..."
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-lc-text-secondary block mb-1">交付物（用逗号分隔）</label>
                <input
                  value={historyDeliverables}
                  onChange={e => setHistoryDeliverables(e.target.value)}
                  className="w-full h-8 px-3 rounded-md border text-xs border-lc-border focus:outline-none focus:ring-1 focus:ring-lc-primary"
                  placeholder="例如: 需求文档, 原型图, 测试报告"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 mt-5">
              <button
                onClick={() => setShowAddHistory(false)}
                className="px-4 h-8 rounded-md text-xs font-medium border border-lc-border text-lc-text-secondary hover:bg-lc-bg-warm transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddHistory}
                disabled={addHistoryMutation.isPending}
                className="px-4 h-8 rounded-md text-xs font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: LC.primary }}
              >
                {addHistoryMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
