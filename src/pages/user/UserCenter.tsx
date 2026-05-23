import { useState } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import { LC } from '@/lib/lute-colors';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { User, FileText, Package, Link2, Settings, Download, Crown } from 'lucide-react';

const TABS = [
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

export default function UserCenter() {
  const [tab, setTab] = useState('overview');

  const { data: reportsData, isLoading: reportsLoading, isError } = trpc.fusion.reports.list.useQuery(
    { limit: 20 },
    { staleTime: 5 * 60 * 1000 }
  );

  if (isError) return <ErrorState />;

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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: LC.primary, color: LC.text }}>高级版</span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>套餐到期: 2027-12-31 | 剩余 580 天</p>
          </div>
          <button className="px-4 h-8 rounded-full text-xs font-bold transition-all hover:brightness-110" style={{ background: LC.primary, color: LC.text }}>
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
        {tab === 'overview' && (
          <div className="grid grid-cols-4 gap-4">
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
                  <span className="text-[10px]" style={{ color: LC.textMuted }}>{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'orders' && (
          <table className="w-full">
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
                  <td className="py-3 px-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: o.status === '生效中' ? LC.successLight : LC.dangerLight, color: o.status === '生效中' ? LC.success : LC.danger }}>{o.status}</span></td>
                  <td className="py-3 px-3 text-xs text-lc-text-muted">{o.expire}</td>
                  <td className="py-3 px-3"><button className="text-[10px] font-bold" style={{ color: LC.primary, background: LC.textInverse, padding: '3px 10px', borderRadius: 6 }}>续费</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

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
            <table className="w-full">
              <thead>
                <tr className="bg-lc-bg-warm">
                  {['报告名称','类型','创建日期','状态','操作'].map(h => <th key={h} className="py-2.5 px-3 text-xs font-semibold text-left text-lc-text-secondary">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {reportsData?.items.map((r: any, i: number) => (
                  <tr key={r.reportId ?? i} className="border-b hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                    <td className="py-2.5 px-3 text-xs font-medium text-lc-text-primary">{r.title}</td>
                    <td className="py-2.5 px-3"><span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: LC.primaryLight, color: LC.primary }}>融合分析</span></td>
                     <td className="py-2.5 px-3 text-xs text-lc-text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('zh-CN') : '-'}</td>
                    <td className="py-2.5 px-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: r.status === 'completed' ? LC.successLight : LC.warningLight, color: r.status === 'completed' ? LC.success : LC.warning }}>{r.status === 'completed' ? '已完成' : '生成中'}</span></td>
                    <td className="py-2.5 px-3"><button className="text-[10px] font-bold flex items-center gap-1 text-lc-primary"><Download size={10} /> 下载</button></td>
                  </tr>
                ))}
                {(!reportsData?.items || reportsData.items.length === 0) && (
                  <tr><td colSpan={5} className="py-8 text-center text-xs text-lc-text-muted">暂无报告记录</td></tr>
                )}
              </tbody>
            </table>
          )
        )}

        {tab === 'params' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Settings size={36} className="text-lc-border" />
            <p className="text-sm font-medium mt-3" style={{ color: LC.textMuted }}>暂无自定义参数</p>
            <p className="text-xs mt-1" style={{ color: LC.textMuted }}>创建报告时可保存自定义筛选参数</p>
          </div>
        )}

        {tab === 'links' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Link2 size={36} className="text-lc-border" />
            <p className="text-sm font-medium mt-3" style={{ color: LC.textMuted }}>暂无推广链接</p>
            <p className="text-xs mt-1" style={{ color: LC.textMuted }}>邀请好友获取奖励</p>
          </div>
        )}
      </div>
    </div>
  );
}
