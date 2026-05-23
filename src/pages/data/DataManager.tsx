import { useState, useCallback, useRef } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { LC } from '@/lib/lute-colors';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';
import {
  Upload, Database, Activity, CheckCircle, XCircle,
  AlertCircle, RefreshCw, Settings, Layers, ChevronRight, ChevronDown,
} from 'lucide-react';

const DATA_SOURCES = [
  { dataKey: 'ods_tiktok_products',  label: 'TikTok 商品',  layer: 'ODS', icon: '📦', targetTable: 'ods_tiktok_products' },
  { dataKey: 'ods_tiktok_creators',  label: 'TikTok 达人',  layer: 'ODS', icon: '👤', targetTable: 'ods_tiktok_creators' },
  { dataKey: 'ods_tiktok_shops',     label: 'TikTok 小店',  layer: 'ODS', icon: '🏪', targetTable: 'ods_tiktok_shops' },
  { dataKey: 'ods_tiktok_videos',    label: 'TikTok 视频',  layer: 'ODS', icon: '🎬', targetTable: 'ods_tiktok_videos' },
  { dataKey: 'ods_tiktok_lives',     label: 'TikTok 直播',  layer: 'ODS', icon: '📡', targetTable: 'ods_tiktok_lives' },
  { dataKey: 'ods_amazon_products',  label: 'Amazon 商品',  layer: 'ODS', icon: '📋', targetTable: 'ods_amazon_products' },
  { dataKey: 'ods_amazon_keywords',  label: 'Amazon 关键词',layer: 'ODS', icon: '🔑', targetTable: 'ods_amazon_keywords' },
  { dataKey: 'ods_amazon_reviews',   label: 'Amazon 评论',  layer: 'ODS', icon: '💬', targetTable: 'ods_amazon_reviews' },
];

type TabKey = 'sources' | 'logs' | 'quality' | 'settings';
type ParsedData = { headers: string[]; rows: Record<string, unknown>[]; total: number };

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, [string, string, string]> = {
    success: [LC.successLight, LC.success, '成功'],
    partial: [LC.warningLight, LC.warning, '部分成功'],
    failed:  [LC.dangerLight,  LC.danger,  '失败'],
    running: [`${LC.primary}15`, LC.primary, '处理中'],
    pending: [LC.bgWarm, LC.textMuted, '等待中'],
  };
  const [bg, color, label] = m[status] ?? m.pending;
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: bg, color }}>{label}</span>;
}

function LayerBadge({ layer }: { layer: string }) {
  const colors: Record<string, string> = { ODS: '#6366F1', DWD: '#0891B2', DWS: '#059669', ADS: '#D97706' };
  const c = colors[layer] ?? LC.primary;
  return <span className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider" style={{ background: `${c}15`, color: c }}>{layer}</span>;
}

export default function DataManager() {
  const [tab, setTab] = useState<TabKey>('sources');
  const [src, setSrc] = useState<typeof DATA_SOURCES[0] | null>(null);
  const [snapshotDate, setSnapshotDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [importing, setImporting] = useState(false);
  const [dryResult, setDryResult] = useState<{ totalRows: number; failedRows: number; errorSummary: { row: number; field: string; message: string }[] } | null>(null);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: odsStatus, isLoading: odsLoading, isError: odsErr, refetch: refetchOds } = trpc.dataManager.ods.latestDates.useQuery(undefined, { staleTime: 30_000 });
  const { data: logs, isLoading: logsLoading, isError: logsErr, refetch: refetchLogs } = trpc.dataManager.import.logs.useQuery({ limit: 30 }, { staleTime: 10_000 });
  const { data: stats } = trpc.dataManager.import.stats.useQuery(undefined, { staleTime: 30_000 });
  const ingest = trpc.dataManager.import.ingest.useMutation({ onSuccess: () => { void refetchOds(); void refetchLogs(); } });

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); }, []);

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = xlsxRead(data, { type: 'array' });
      const raw = xlsxUtils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      if (!raw.length) { flash('文件为空'); return; }
      setParsed({ headers: Object.keys(raw[0]), rows: raw, total: raw.length });
      setDryResult(null);
    };
    reader.readAsArrayBuffer(file);
  }, [flash]);

  const dryRun = useCallback(async () => {
    if (!src || !parsed) return;
    const r = await ingest.mutateAsync({ dataKey: src.dataKey, snapshotDate, records: parsed.rows, dryRun: true });
    setDryResult(r as typeof dryResult);
  }, [src, parsed, snapshotDate, ingest]);

  const doImport = useCallback(async () => {
    if (!src || !parsed) return;
    setImporting(true);
    try {
      const r = await ingest.mutateAsync({ dataKey: src.dataKey, snapshotDate, records: parsed.rows, dryRun: false });
      flash(`导入完成：${r.successRows} 条成功${r.failedRows > 0 ? `，${r.failedRows} 失败` : ''}`);
      setParsed(null); setDryResult(null); setSrc(null);
    } finally { setImporting(false); }
  }, [src, parsed, snapshotDate, ingest, flash]);

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'sources',  label: '数据源',   icon: <Database size={14} /> },
    { key: 'logs',     label: '导入记录', icon: <Activity size={14} /> },
    { key: 'quality',  label: '数据质量', icon: <Layers size={14} /> },
    { key: 'settings', label: '模板配置', icon: <Settings size={14} /> },
  ];

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={['数据管理中心']} />
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-xs font-medium shadow-lg" style={{ background: LC.primary }}>{toast}</div>
      )}

      <div className="bg-white rounded-lg shadow-lc ring-1 ring-lc-border/60 mb-4 p-4">
        <div className="grid grid-cols-4 gap-3">
          {([
            ['已配置数据源', DATA_SOURCES.length, Database, LC.primary],
            ['导入总次数', stats?.total ?? 0, Activity, LC.teal],
            ['成功次数', stats?.success ?? 0, CheckCircle, LC.success],
            ['累计导入行数', (stats?.totalRows ?? 0).toLocaleString(), Layers, LC.warning],
          ] as const).map(([label, value, Icon, color]) => (
            <div key={label} className="rounded-lg p-3 bg-lc-bg-warm">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} style={{ color }} />
                <span className="text-[10px] font-medium text-lc-text-muted">{label}</span>
              </div>
              <div className="text-lg font-bold font-mono-num" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lc ring-1 ring-lc-border/60">
        <div className="flex gap-6 border-b border-lc-border px-4 pt-3">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 pb-2.5 text-xs font-medium transition-all border-b-2"
              style={tab === t.key ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {tab === 'sources' && (
          <div className="p-4">
            {!src ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-lc-primary">选择数据源开始导入</h3>
                  <span className="text-[10px] text-lc-text-muted">支持 .xlsx .xls .csv</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {DATA_SOURCES.map(s => {
                    const st = odsStatus?.[s.targetTable];
                    return (
                      <button key={s.dataKey} onClick={() => setSrc(s)}
                        className="text-left rounded-lg p-3 border transition-all hover:shadow-lc-hover hover:-translate-y-0.5 ring-1"
                        style={{ borderColor: LC.border, background: LC.bgWarm }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-base">{s.icon}</span>
                          <LayerBadge layer={s.layer} />
                        </div>
                        <div className="text-xs font-semibold text-lc-text-primary mb-1">{s.label}</div>
                        {odsLoading ? <Skeleton className="h-3 w-20" /> : (
                          <div className="text-[10px] text-lc-text-muted">
                            {st?.latestDate ? `最新: ${st.latestDate} · ${(st.rowCount ?? 0).toLocaleString()}行` : '暂无数据'}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => { setSrc(null); setParsed(null); setDryResult(null); }}
                    className="flex items-center gap-1 text-xs text-lc-text-muted hover:text-lc-primary transition-colors">
                    <ChevronRight size={12} className="rotate-180" /> 返回
                  </button>
                  <span className="text-sm font-semibold text-lc-primary">{src.icon} {src.label}</span>
                  <LayerBadge layer={src.layer} />
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <label className="text-xs font-medium text-lc-text-secondary">快照日期</label>
                  <input type="date" value={snapshotDate} onChange={e => setSnapshotDate(e.target.value)}
                    className="h-8 border rounded px-2 text-xs focus:outline-none focus:ring-1" style={{ borderColor: LC.border }} />
                </div>

                {!parsed ? (
                  <div className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-lc-primary"
                    style={{ borderColor: LC.border }}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileRef.current?.click()}>
                    <Upload size={32} className="mx-auto mb-3 text-lc-border" />
                    <p className="text-sm font-medium text-lc-text-muted">拖放文件到此处，或点击选择</p>
                    <p className="text-[11px] mt-1 text-lc-border-strong">支持 .xlsx .xls .csv</p>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={e => e.target.files?.[0] && parseFile(e.target.files[0])} />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-lc-bg-warm">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={16} className="text-lc-success" />
                        <div>
                          <div className="text-xs font-semibold text-lc-text-primary">已解析 {parsed.total.toLocaleString()} 行</div>
                          <div className="text-[10px] text-lc-text-muted mt-0.5">
                            字段: {parsed.headers.slice(0, 6).join(', ')}{parsed.headers.length > 6 ? ` +${parsed.headers.length - 6}` : ''}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => { setParsed(null); setDryResult(null); }}
                        className="text-[10px] text-lc-text-muted hover:text-lc-danger transition-colors">重新选择</button>
                    </div>

                    <div className="overflow-x-auto border rounded-lg mb-4" style={{ borderColor: LC.border }}>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-lc-bg-warm">
                            {parsed.headers.slice(0, 8).map(h => (
                              <th key={h} className="py-2 px-3 text-left text-lc-text-secondary font-medium whitespace-nowrap">{h}</th>
                            ))}
                            {parsed.headers.length > 8 && <th className="py-2 px-3 text-lc-text-muted">+{parsed.headers.length - 8}列</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {parsed.rows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t hover:bg-lc-bg-warm transition-colors" style={{ borderColor: LC.border }}>
                              {parsed.headers.slice(0, 8).map(h => (
                                <td key={h} className="py-2 px-3 text-lc-text-primary whitespace-nowrap max-w-[120px] truncate">{String(row[h] ?? '')}</td>
                              ))}
                              {parsed.headers.length > 8 && <td className="py-2 px-3 text-lc-text-muted">...</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsed.total > 5 && (
                        <div className="px-3 py-2 text-[10px] text-lc-text-muted border-t" style={{ borderColor: LC.border }}>
                          仅展示前 5 行，共 {parsed.total.toLocaleString()} 行
                        </div>
                      )}
                    </div>

                    {dryResult && (
                      <div className="mb-4 p-3 rounded-lg border"
                        style={{ borderColor: dryResult.failedRows > 0 ? LC.warning : LC.success, background: dryResult.failedRows > 0 ? LC.warningLight : LC.successLight }}>
                        <div className="flex items-center gap-2 mb-2">
                          {dryResult.failedRows > 0
                            ? <AlertCircle size={14} style={{ color: LC.warning }} />
                            : <CheckCircle size={14} style={{ color: LC.success }} />}
                          <span className="text-xs font-semibold" style={{ color: dryResult.failedRows > 0 ? LC.warning : LC.success }}>
                            预检：{dryResult.totalRows} 行，{dryResult.failedRows} 行有问题
                          </span>
                        </div>
                        {dryResult.errorSummary.slice(0, 5).map((e, i) => (
                          <div key={i} className="text-[10px] text-lc-text-secondary ml-5">第 {e.row} 行 · {e.field}：{e.message}</div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button onClick={dryRun} disabled={importing}
                        className="h-9 px-5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5"
                        style={{ borderColor: LC.primary, color: LC.primary }}>
                        <CheckCircle size={13} /> 预检（不写入）
                      </button>
                      <button onClick={doImport} disabled={importing}
                        className="h-9 px-6 text-white text-xs font-medium rounded-lg transition-all hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
                        style={{ background: LC.primary }}>
                        {importing ? <><RefreshCw size={13} className="animate-spin" /> 导入中...</> : <><Upload size={13} /> 确认导入 {parsed.total.toLocaleString()} 行</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'logs' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-lc-primary">最近导入记录</h3>
              <button onClick={() => void refetchLogs()} className="flex items-center gap-1 text-xs text-lc-primary">
                <RefreshCw size={12} /> 刷新
              </button>
            </div>
            {logsErr ? <ErrorState /> : logsLoading ? (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-lc-bg-warm">
                    {['数据源', '目标层/表', '状态', '总行数', '成功', '失败', '时间', '耗时'].map(h => (
                      <th key={h} className="py-2.5 px-3 text-left text-lc-text-secondary font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(logs ?? []).map(log => {
                    const s = DATA_SOURCES.find(x => x.dataKey === log.dataKey);
                    const dur = log.completedAt
                      ? Math.round((new Date(log.completedAt).getTime() - new Date(log.triggeredAt).getTime()) / 1000)
                      : null;
                    return (
                      <tr key={log.id} className="border-b hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                        <td className="py-2.5 px-3 font-medium text-lc-text-primary">{s?.icon} {s?.label ?? log.dataKey}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <LayerBadge layer={(log.targetLayer ?? 'custom').toUpperCase()} />
                            <span className="text-lc-text-muted">{log.targetTable ?? '-'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3"><StatusBadge status={log.status} /></td>
                        <td className="py-2.5 px-3 font-mono-num text-lc-text-primary">{(log.totalRows ?? 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono-num text-lc-success">{(log.successRows ?? 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono-num" style={{ color: (log.failedRows ?? 0) > 0 ? LC.danger : LC.textMuted }}>{log.failedRows ?? 0}</td>
                        <td className="py-2.5 px-3 text-lc-text-muted">
                          {new Date(log.triggeredAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num text-lc-text-muted">{dur != null ? `${dur}s` : '-'}</td>
                      </tr>
                    );
                  })}
                  {!(logs ?? []).length && (
                    <tr><td colSpan={8} className="py-10 text-center text-xs text-lc-text-muted">暂无导入记录</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'quality' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-lc-primary">ODS 层数据质量</h3>
              <button onClick={() => void refetchOds()} className="flex items-center gap-1 text-xs text-lc-primary">
                <RefreshCw size={12} /> 刷新
              </button>
            </div>
            {odsErr ? <ErrorState /> : odsLoading ? (
              <div className="grid grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {DATA_SOURCES.map(s => {
                  const st = odsStatus?.[s.targetTable];
                  const hasData = (st?.rowCount ?? 0) > 0;
                  const isStale = st?.latestDate
                    ? new Date().getTime() - new Date(st.latestDate).getTime() > 2 * 86400_000
                    : false;
                  return (
                    <div key={s.dataKey} className="rounded-lg p-3 border ring-1"
                      style={{ borderColor: hasData && !isStale ? LC.success : isStale ? LC.warning : LC.border, background: LC.bgWarm }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span>{s.icon}</span>
                          <span className="text-xs font-semibold text-lc-text-primary">{s.label}</span>
                        </div>
                        {hasData ? isStale ? <AlertCircle size={13} style={{ color: LC.warning }} /> : <CheckCircle size={13} style={{ color: LC.success }} /> : <XCircle size={13} style={{ color: LC.border }} />}
                      </div>
                      <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-lc-text-muted">总记录</span>
                          <span className="font-mono-num font-semibold text-lc-text-primary">{(st?.rowCount ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-lc-text-muted">最新快照</span>
                          <span className="font-mono-num" style={{ color: isStale ? LC.warning : LC.textSecondary }}>{st?.latestDate ?? '无'}</span>
                        </div>
                        {isStale && hasData && <div style={{ color: LC.warning }}>⚠️ 超过 2 天未更新</div>}
                        {!hasData && <div className="text-lc-text-muted">待导入</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-6 p-4 rounded-lg border" style={{ borderColor: LC.border, background: LC.bgWarm }}>
              <h4 className="text-xs font-semibold text-lc-text-primary mb-3 flex items-center gap-1.5">
                <ChevronDown size={12} /> 数仓分层说明
              </h4>
              <div className="grid grid-cols-4 gap-3 text-[10px]">
                {([
                  ['ODS', '#6366F1', '原始数据层 — 直接落库，保留原始字段，含 snapshot_date'],
                  ['DWD', '#0891B2', '标准化明细层 — 类型统一、字段规范、去重'],
                  ['DWS', '#059669', '汇总层 — 按概念/品类聚合，SHI/CVI 计算数据源'],
                  ['ADS', '#D97706', '应用层 — 直接服务前端 API，按场景预聚合'],
                ] as const).map(([l, c, d]) => (
                  <div key={l} className="rounded p-2" style={{ background: `${c}08`, border: `1px solid ${c}20` }}>
                    <div className="font-bold mb-1" style={{ color: c }}>{l}</div>
                    <div className="text-lc-text-muted leading-relaxed">{d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-lc-primary mb-4">数据源模板配置</h3>
            <div className="space-y-3">
              {DATA_SOURCES.map(s => (
                <div key={s.dataKey} className="rounded-lg border p-3 ring-1 ring-lc-border/40">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{s.icon}</span>
                    <span className="text-xs font-semibold text-lc-text-primary">{s.label}</span>
                    <LayerBadge layer={s.layer} />
                    <code className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-lc-bg-warm text-lc-text-muted">→ {s.targetTable}</code>
                  </div>
                  <p className="text-[10px] text-lc-text-muted">
                    支持别名字段映射（如 "月销量" / monthly_sales / monthlySales 均可识别）。上传 Excel 列名无需严格匹配。
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg text-[10px] text-lc-text-muted" style={{ background: LC.bgWarm }}>
              <strong className="text-lc-text-secondary">自定义字段映射</strong>（即将上线）：配置字段别名规则、数据校验范围、必填字段标记。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
