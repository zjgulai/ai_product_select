/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import { LC } from '@/lib/lute-colors';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User, FileText, Package, Link2, Settings, Download, Crown,
  LayoutDashboard, Sparkles, Eye, Heart, ArrowRight,
  TrendingUp, Clock
} from 'lucide-react';

const TABS = [
  { key: 'workspace', label: '我的工作台', icon: LayoutDashboard },
  { key: 'overview', label: '账号总览', icon: User },
  { key: 'orders', label: '订购记录', icon: Package },
  { key: 'reports', label: '报告记录', icon: FileText },
  { key: 'params', label: '参数库', icon: Settings },
  { key: 'links', label: '推广链接', icon: Link2 },
];

const ORDERS = [
  { plan: "高级版年付", price: "¥2,999", date: "2026-12-31", status: "生效中", expire: "2027-12-31" },
  { plan: "专业版月付", price: "¥399", date: "2026-11-30", status: "已过期", expire: "2026-12-30" },
];

const QUICK_ACTIONS = [
  { label: '选品机会榜', icon: Sparkles, path: '/fusion/opportunities', color: LC.primary },
  { label: '生成报告', icon: FileText, path: '/fusion/report', color: LC.success },
  { label: '我的关注', icon: Heart, path: '/tiktok/attention', color: LC.warning },
  { label: '关键词趋势', icon: TrendingUp, path: '/amazon/keyword', color: LC.teal },
];

export default function UserCenter() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('workspace');

  const { data: reportsData, isLoading: reportsLoading, isError } = trpc.fusion.reports.list.useQuery(
    { limit: 20 },
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: conceptsData } = trpc.fusion.concepts.list.useQuery(
    { limit: 10 },
    { staleTime: 5 * 60 * 1000 }
  );

  if (isError) return <ErrorState />;

  const reports = reportsData?.items || [];
  const concepts = conceptsData?.items || [];

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={["用户中心"]} />

      {/* User Header */}
      <div className="rounded-xl p-5 mb-4 ring-1 ring-lc-border/60" style={{ background: `linear-gradient(135deg, ${LC.primary} 0%, ${LC.primaryDark} 100%)` }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-lc-primary">
            <User size={24} className="text-lc-text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold" style={{ color: LC.textInverse }}>lute_user_001</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: LC.primary, color: LC.text }}>高级版</span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>套餐到期: 2027-12-31 | 剩余 580 天</p>
          </div>
          <button onClick={() => { import('sonner').then(({ toast }) => toast.info('演示环境不支持支付')); }} className="px-4 h-8 rounded-full text-xs font-bold transition-all hover:brightness-110" style={{ background: LC.primary, color: LC.text }}>
            <Crown size={12} className="inline mr-1" />续费会员
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow-lc border-b px-4 pt-3 ring-1 ring-lc-border/60">
        <div className="flex gap-5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="pb-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-1.5"
              style={tab === t.key ? { color: LC.text, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>
              <t.icon size={13} />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-lg shadow-lc p-5 ring-1 ring-lc-border/60">
        {/* ========== 工作台 ========== */}
        {tab === 'workspace' && (
          <div className="space-y-5">
            {/* 快捷操作 */}
            <div>
              <h4 className="text-xs font-semibold text-lc-text-secondary mb-3">快捷操作</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lc-hover"
                    style={{ borderColor: LC.border, background: LC.bgWarm }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${action.color}12` }}>
                      <action.icon size={18} style={{ color: action.color }} />
                    </div>
                    <span className="text-xs font-medium text-lc-text-primary">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 最近报告 + 最近关注 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 最近报告 */}
              <div className="rounded-lg p-4 ring-1 ring-lc-border/60">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-lc-text-secondary flex items-center gap-1.5">
                    <FileText size={12} /> 最近生成的报告
                  </h4>
                  <button
                    onClick={() => setTab('reports')}
                    className="text-xs text-lc-primary flex items-center gap-0.5 hover:underline"
                  >
                    查看全部 <ArrowRight size={10} />
                  </button>
                </div>
                {reportsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-lc-text-muted">暂无报告</p>
                    <button
                      onClick={() => navigate('/fusion/report')}
                      className="mt-2 text-xs px-3 py-1 rounded-full bg-lc-primary text-white font-medium"
                    >
                      去生成报告
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reports.slice(0, 4).map((r: any) => (
                      <div key={r.reportId} className="flex items-center justify-between p-2 rounded-lg hover:bg-lc-bg-warm transition-colors cursor-pointer"
                        onClick={() => navigate('/fusion/report')}>
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={12} className="text-lc-primary shrink-0" />
                          <span className="text-xs text-lc-text-primary truncate">{r.title}</span>
                        </div>
                        <span className="text-xs text-lc-text-muted shrink-0">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('zh-CN') : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 最近关注概念 */}
              <div className="rounded-lg p-4 ring-1 ring-lc-border/60">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-lc-text-secondary flex items-center gap-1.5">
                    <Heart size={12} /> 最近关注的概念
                  </h4>
                  <button
                    onClick={() => navigate('/tiktok/attention')}
                    className="text-xs text-lc-primary flex items-center gap-0.5 hover:underline"
                  >
                    查看全部 <ArrowRight size={10} />
                  </button>
                </div>
                {concepts.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-lc-text-muted">暂无关注概念</p>
                    <button
                      onClick={() => navigate('/fusion/opportunities')}
                      className="mt-2 text-xs px-3 py-1 rounded-full bg-lc-primary text-white font-medium"
                    >
                      去发现机会
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {concepts.slice(0, 4).map((c: any) => (
                      <div key={c.conceptId} className="flex items-center justify-between p-2 rounded-lg hover:bg-lc-bg-warm transition-colors cursor-pointer"
                        onClick={() => navigate(`/fusion/concept/${c.conceptId}`)}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ background: LC.primaryLight, color: LC.primary }}>
                            {(c.name ?? '?')[0]}
                          </div>
                          <span className="text-xs text-lc-text-primary truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-mono-num text-lc-primary">SHI {c.shiScore}</span>
                          <span className="text-xs font-mono-num text-lc-success">CVI {c.cviScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 最近活动 */}
            <div className="rounded-lg p-4 ring-1 ring-lc-border/60">
              <h4 className="text-xs font-semibold text-lc-text-secondary mb-3 flex items-center gap-1.5">
                <Clock size={12} /> 最近活动
              </h4>
              <div className="space-y-2">
                {[
                  { action: '生成了融合分析报告', target: '便携温奶器', time: '2小时前', icon: FileText },
                  { action: '关注了选品概念', target: '智能宠物喂食器', time: '5小时前', icon: Heart },
                  { action: '查看了Amazon关键词趋势', target: 'baby bottle warmer', time: '1天前', icon: TrendingUp },
                  { action: '生成了融合分析报告', target: 'LED化妆镜', time: '2天前', icon: FileText },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-lc-bg-warm transition-colors">
                    <activity.icon size={12} className="text-lc-text-muted shrink-0" />
                    <span className="text-xs text-lc-text-primary">{activity.action}</span>
                    <span className="text-xs font-medium text-lc-primary">{activity.target}</span>
                    <span className="text-xs text-lc-text-muted ml-auto">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== 账号总览 ========== */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '剩余天数', value: '580', unit: '天', color: LC.primary },
              { label: '已生成报告', value: String(reportsData?.total || 0), unit: '份', color: LC.primary },
              { label: '关注商品', value: '128', unit: '个', color: LC.success },
              { label: '关注达人', value: '56', unit: '个', color: LC.warning },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4 ring-1 ring-lc-border/40 bg-lc-bg-warm">
                <div className="text-[11px] font-medium mb-2 text-lc-text-muted">{s.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono-num" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-xs" style={{ color: LC.textMuted }}>{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== 订购记录 ========== */}
        {tab === 'orders' && (
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-lc-bg-warm">
                {['套餐','金额','开通日期','状态','到期日','操作'].map(h => <th key={h} className="py-2.5 px-3 text-xs font-semibold text-left text-lc-text-secondary">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o, i) => (
                <tr key={i} className="border-b border-lc-border-light">
                  <td className="py-3 px-3 text-xs font-semibold text-lc-text-primary">{o.plan}</td>
                  <td className="py-3 px-3 text-xs font-mono-num font-bold text-lc-primary">{o.price}</td>
                  <td className="py-3 px-3 text-xs text-lc-text-muted">{o.date}</td>
                  <td className="py-3 px-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: o.status === '生效中' ? LC.successLight : LC.dangerLight, color: o.status === '生效中' ? LC.success : LC.danger }}>{o.status}</span></td>
                  <td className="py-3 px-3 text-xs text-lc-text-muted">{o.expire}</td>
                  <td className="py-3 px-3"><button className="text-xs font-bold" style={{ color: LC.primary, background: LC.textInverse, padding: '3px 10px', borderRadius: 6 }}>续费</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ========== 报告记录 ========== */}
        {tab === 'reports' && (
          reportsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-lc-bg-warm">
                  {['报告名称','类型','创建日期','状态','操作'].map(h => <th key={h} className="py-2.5 px-3 text-xs font-semibold text-left text-lc-text-secondary">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {reportsData?.items.map((r: any, i: number) => (
                  <tr key={r.reportId ?? i} className="border-b hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                    <td className="py-2.5 px-3 text-xs font-medium text-lc-text-primary">{r.title}</td>
                    <td className="py-2.5 px-3"><span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: LC.primaryLight, color: LC.primary }}>融合分析</span></td>
                     <td className="py-2.5 px-3 text-xs text-lc-text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('zh-CN') : '-'}</td>
                    <td className="py-2.5 px-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: r.status === 'completed' ? LC.successLight : LC.warningLight, color: r.status === 'completed' ? LC.success : LC.warning }}>{r.status === 'completed' ? '已完成' : '生成中'}</span></td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate('/fusion/report')}
                          className="text-xs font-bold flex items-center gap-1 text-lc-primary"
                        >
                          <Eye size={10} /> 查看
                        </button>
                        <button className="text-xs font-bold flex items-center gap-1 text-lc-primary">
                          <Download size={10} /> 下载
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!reportsData?.items || reportsData.items.length === 0) && (
                  <tr><td colSpan={5} className="py-8 text-center text-xs text-lc-text-muted">暂无报告记录</td></tr>
                )}
              </tbody>
            </table>
          )
        )}

        {/* ========== 参数库 ========== */}
        {tab === 'params' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Settings size={36} className="text-lc-border" />
            <p className="text-sm font-medium mt-3" style={{ color: LC.textMuted }}>暂无自定义参数</p>
            <span className="mt-2 text-xs px-2 py-0.5 rounded-full bg-lc-warning/10 text-lc-warning font-medium">即将上线</span>
            <p className="text-xs mt-2" style={{ color: LC.textMuted }}>创建报告时可保存自定义筛选参数</p>
          </div>
        )}

        {/* ========== 推广链接 ========== */}
        {tab === 'links' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Link2 size={36} className="text-lc-border" />
            <p className="text-sm font-medium mt-3" style={{ color: LC.textMuted }}>暂无推广链接</p>
            <span className="mt-2 text-xs px-2 py-0.5 rounded-full bg-lc-warning/10 text-lc-warning font-medium">即将上线</span>
            <p className="text-xs mt-2" style={{ color: LC.textMuted }}>邀请好友获取奖励</p>
          </div>
        )}
      </div>
    </div>
  );
}
