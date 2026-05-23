import { useState, useRef, useCallback, useMemo } from 'react';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { LC } from '@/lib/lute-colors';
import { trpc } from '@/providers/trpc';
import {
  Upload, Download, Trash2, Search, Database, CheckCircle2, AlertCircle,
  FolderOpen, FileSpreadsheet, ChevronDown, ChevronUp, Table2, X, Loader2,
  Save, Package, FileText, Search as SearchIcon, TrendingUp
} from 'lucide-react';

// ===== Types =====
type ToastType = { message: string; type: 'success' | 'error' };

// ===== Icon Map for pages =====
const PAGE_ICONS: Record<string, any> = {
  tiktok: TrendingUp, amazon: SearchIcon, report: FileText,
};

const PAGE_LABELS: Record<string, string> = {
  tiktok: 'TikTok趋势', amazon: 'Amazon趋势', report: '报告分析',
};

// ===== Toast =====
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  setTimeout(onClose, 3000);
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-fadeIn"
      style={{ background: type === 'success' ? LC.success : LC.danger }}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

// ===== Template Selector =====
function TemplateSelector({
  selectedKey, onSelect, templates, activeKeys
}: {
  selectedKey: string; onSelect: (k: string) => void;
  templates: any[]; activeKeys: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const selected = templates.find(t => t.dataKey === selectedKey);
  const filtered = templates.filter(t =>
    t.name.includes(filter) || t.dataKey.includes(filter) || t.page.includes(filter)
  );

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const t of filtered) {
      if (!g[t.page]) g[t.page] = [];
      g[t.page].push(t);
    }
    return g;
  }, [filtered]);

  return (
    <div className="relative">
      <label className="block text-xs font-medium mb-1.5 text-lc-text-secondary">
        选择数据模板 <span className="text-[#C84040]">*</span>
      </label>
      <button
        className="w-full h-10 px-3 rounded-lg border text-left text-sm flex items-center justify-between transition-all focus:outline-none focus:ring-1"
        style={{ borderColor: LC.border, color: selectedKey ? LC.text : LC.textMuted, background: LC.textInverse }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <Database size={14} className="text-lc-primary" />
              {selected.name}
              {activeKeys.includes(selected.dataKey) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: LC.successLight, color: LC.success }}>已入库</span>
              )}
            </>
          ) : '请选择数据模板...'}
        </span>
        {isOpen ? <ChevronUp size={14} className="text-lc-text-muted" /> : <ChevronDown size={14} className="text-lc-text-muted" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg border bg-white z-30 max-h-80 overflow-auto border-lc-border">
          <div className="p-2 border-b sticky top-0 bg-white border-lc-border">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-lc-text-muted" />
              <input
                type="text" placeholder="搜索模板..."
                className="w-full h-8 pl-7 pr-2 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-lc-primary border-lc-border"
                value={filter} onChange={e => setFilter(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          {Object.entries(grouped).map(([page, items]) => {
            const Icon = PAGE_ICONS[page] || Package;
            return (
              <div key={page}>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1"
                  style={{ color: LC.textMuted, background: '#FAF8F6' }}>
                  <Icon size={10} /> {PAGE_LABELS[page] || page}
                </div>
                {items.map(t => (
                  <button key={t.dataKey}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-lc-primary-light transition-colors flex items-center gap-2"
                    onClick={() => { onSelect(t.dataKey); setIsOpen(false); }}
                  >
                    <Table2 size={12} style={{ color: activeKeys.includes(t.dataKey) ? LC.success : 'LC.textMuted' }} />
                    <span style={{ color: selectedKey === t.dataKey ? LC.primary : LC.text, fontWeight: selectedKey === t.dataKey ? 600 : 400 }}>
                      {t.name}
                    </span>
                    {activeKeys.includes(t.dataKey) && (
                      <CheckCircle2 size={12} className="ml-auto text-lc-success" />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Upload Zone =====
function UploadZone({ onFile, disabled }: { onFile: (f: File) => void; disabled: boolean }) {
  const [isDragging, setIsDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = useCallback((file: File) => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      onFile(file);
    }
  }, [onFile]);

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={isDragging ? { borderColor: LC.primary, background: LC.primaryLight } : { borderColor: LC.border }}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => { e.preventDefault(); setIsDragging(false); handle(e.dataTransfer.files[0]); }}
      onClick={() => !disabled && ref.current?.click()}
    >
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} disabled={disabled} />
      <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 bg-lc-primary-light">
        <Upload size={20} className="text-lc-primary" />
      </div>
      <p className="text-xs font-medium text-lc-text-primary">点击或拖拽 Excel 文件</p>
      <p className="text-[10px] mt-0.5 text-lc-text-muted">.xlsx / .xls / .csv</p>
    </div>
  );
}

// ===== Preview Table =====
function PreviewTable({ records, columns }: { records: any[]; columns: { key: string; label: string }[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(records.length / pageSize);
  const rows = records.slice((page - 1) * pageSize, page * pageSize);

  const displayCols = columns.length > 0 ? columns : Object.keys(records[0] || {}).map(k => ({ key: k, label: k }));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-lc-text-secondary">
          预览数据 <span className="font-mono-num text-lc-primary">{records.length}</span> 行
        </p>
        <p className="text-[10px] text-lc-text-muted">仅显示前 100 列</p>
      </div>
      <div className="rounded-lg border overflow-auto max-h-64 border-lc-border">
        <table className="w-full text-[10px]">
          <thead>
            <tr style={{ background: '#FAF8F6' }}>
              {displayCols.slice(0, 100).map(c => (
                <th key={c.key} className="text-left py-2 px-2 font-semibold whitespace-nowrap" style={{ color: LC.textSecondary, borderBottom: `1px solid ${LC.border}` }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b hover:bg-[#FAF8F6] transition-colors border-lc-border-light">
                {displayCols.slice(0, 100).map(c => (
                  <td key={c.key} className="py-1.5 px-2 whitespace-nowrap max-w-[200px] truncate text-lc-text-primary">
                    {String(r[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2">
          <button className="w-6 h-6 rounded flex items-center justify-center text-[10px]" style={{ color: page <= 1 ? 'LC.textMuted' : LC.textSecondary }}
            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>&lt;</button>
          <span className="text-[10px] font-mono-num text-lc-text-secondary">{page}/{totalPages}</span>
          <button className="w-6 h-6 rounded flex items-center justify-center text-[10px]" style={{ color: page >= totalPages ? 'LC.textMuted' : LC.textSecondary }}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>&gt;</button>
        </div>
      )}
    </div>
  );
}

// ===== Main Page =====
export default function DataManager() {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [parsedRecords, setParsedRecords] = useState<any[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // tRPC queries
  const { data: templatesData } = trpc.dataManager.template.list.useQuery();
  const { data: activeKeysData } = trpc.dataManager.dynamic.getActiveKeys.useQuery();
  const { data: fileListData } = trpc.dataManager.file.list.useQuery({ status: 'active' });

  const templates = templatesData ?? [];
  const activeKeys = activeKeysData ?? [];
  const selectedTemplate = templates.find(t => t.dataKey === selectedTemplateKey);

  // tRPC mutations
  const bulkInsertMutation = trpc.dataManager.dynamic.bulkInsert.useMutation({
    onSuccess: (data) => {
      setToast({ message: `成功入库 ${data.inserted} 条数据到「${selectedTemplate?.name}」`, type: 'success' });
      setParsedRecords(null);
      utils.dataManager.dynamic.getActiveKeys.invalidate();
      utils.dataManager.file.list.invalidate();
    },
    onError: () => {
      setToast({ message: '入库失败', type: 'error' });
    },
  });

  const deleteMutation = trpc.dataManager.dynamic.deleteByKey.useMutation({
    onSuccess: () => {
      utils.dataManager.dynamic.getActiveKeys.invalidate();
      setDeletingKey(null);
      setToast({ message: '数据已删除', type: 'success' });
    },
  });

  // Parse file locally for preview
  const handleFile = useCallback(async (file: File) => {
    if (!selectedTemplateKey) { setToast({ message: '请先选择数据模板', type: 'error' }); return; }
    setUploading(true);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      if (wb.SheetNames.length > 0) {
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        if (json.length > 1) {
          const headers = json[0].map(h => String(h ?? '').trim());
          const records: any[] = [];
          for (let i = 1; i < json.length; i++) {
            const row: Record<string, any> = {};
            headers.forEach((h, j) => {
              const v = json[i][j];
              if (typeof v === 'number') row[h] = v;
              else if (!isNaN(Number(v)) && v !== '') row[h] = Number(v);
              else if (v === 'true' || v === 'TRUE') row[h] = true;
              else if (v === 'false' || v === 'FALSE') row[h] = false;
              else row[h] = v ?? '';
            });
            records.push(row);
          }
          setParsedRecords(records);
        }
      }
    } catch (e) {
      setToast({ message: '文件解析失败', type: 'error' });
    } finally {
      setUploading(false);
    }
  }, [selectedTemplateKey]);

  // Store parsed records to DB via tRPC
  const handleUploadToDb = useCallback(() => {
    if (!selectedTemplateKey || !parsedRecords || parsedRecords.length === 0) return;
    bulkInsertMutation.mutate({ dataKey: selectedTemplateKey, records: parsedRecords });
  }, [selectedTemplateKey, parsedRecords, bulkInsertMutation]);

  // Delete data by key

  return (
    <div className="p-6 space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Breadcrumb items={['数据管理']} />

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-lc-text-primary">数据管理</h1>
        <p className="text-xs mt-0.5 text-lc-text-muted">
          上传 Excel 数据到各页面模块。已入库 <span className="font-mono-num font-semibold text-lc-primary">{activeKeys.length}</span> 个数据集
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: '#FAF8F6' }}>
        {[
          { key: 'upload' as const, label: '数据上传', icon: Upload },
          { key: 'manage' as const, label: '数据管理', icon: Database },
        ].map(tab => (
          <button key={tab.key}
            className="flex-1 h-8 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: activeTab === tab.key ? LC.textInverse : 'transparent',
              color: activeTab === tab.key ? LC.primary : LC.textSecondary,
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* === Upload Tab === */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          {/* Step 1: Select Template */}
          <div className="rounded-xl ring-1 ring-lc-border bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-lc-primary">1</div>
              <h3 className="text-xs font-semibold text-lc-text-primary">选择数据模板</h3>
            </div>
            <TemplateSelector
              selectedKey={selectedTemplateKey}
              onSelect={setSelectedTemplateKey}
              templates={templates}
              activeKeys={activeKeys}
            />
            {selectedTemplate && (
              <div className="mt-2 p-2.5 rounded-lg" style={{ background: '#FAF8F6' }}>
                <p className="text-[10px] text-lc-text-muted">{selectedTemplate.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selectedTemplate.columns.map((c: any) => (
                    <span key={c.key} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: LC.primaryLight, color: LC.primary }}>
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Upload File */}
          {selectedTemplateKey && (
            <div className="rounded-xl ring-1 ring-lc-border bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-lc-primary">2</div>
                <h3 className="text-xs font-semibold text-lc-text-primary">上传 Excel 文件</h3>
                {parsedRecords && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: LC.successLight, color: LC.success }}>
                    已解析 {parsedRecords.length} 行
                  </span>
                )}
              </div>

              {!parsedRecords ? (
                <UploadZone onFile={handleFile} disabled={uploading} />
              ) : (
                <PreviewTable
                  records={parsedRecords}
                  columns={selectedTemplate?.columns?.map((c: any) => ({ key: c.key, label: c.label })) ?? []}
                />
              )}
            </div>
          )}

          {/* Step 3: Confirm Import */}
          {parsedRecords && parsedRecords.length > 0 && (
            <div className="rounded-xl ring-1 ring-lc-border bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-lc-primary">3</div>
                <h3 className="text-xs font-semibold text-lc-text-primary">确认入库</h3>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-lc-text-secondary">
                  将 <span className="font-mono-num font-semibold text-lc-primary">{parsedRecords.length}</span> 条数据写入 <span className="font-medium text-lc-text-primary">「{selectedTemplate?.name}」</span>
                  {activeKeys.includes(selectedTemplateKey) && <span className="text-[#C84040] ml-1">（将覆盖已有数据）</span>}
                </p>
                <div className="flex gap-2">
                  <button
                    className="h-8 px-4 rounded-lg text-xs font-medium border transition-colors"
                    style={{ borderColor: LC.border, color: LC.textSecondary }}
                    onClick={() => setParsedRecords(null)}
                  >
                    取消
                  </button>
                  <button
                    className="h-8 px-4 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 bg-lc-primary"
                    onClick={handleUploadToDb}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    确认入库
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === Manage Tab === */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {/* Active datasets grouped by page */}
          {(['tiktok', 'amazon', 'report'] as const).map(page => {
            const pageTemplates = templates.filter(t => t.page === page && activeKeys.includes(t.dataKey));
            if (pageTemplates.length === 0) return null;
            const Icon = PAGE_ICONS[page] || Package;
            return (
              <div key={page} className="rounded-xl ring-1 ring-lc-border bg-white overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: LC.border, background: '#FAF8F6' }}>
                  <Icon size={14} className="text-lc-primary" />
                  <span className="text-xs font-semibold text-lc-text-primary">{PAGE_LABELS[page]}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: LC.primaryLight, color: LC.primary }}>{pageTemplates.length}</span>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {pageTemplates.map(t => (
                      <tr key={t.dataKey} className="border-b hover:bg-[#FAF8F6] transition-colors border-lc-border-light">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Table2 size={14} style={{ color: 'LC.textMuted' }} />
                            <div>
                              <p className="font-medium text-[12px] text-lc-text-primary">{t.name}</p>
                              <p className="text-[10px] text-lc-text-muted">key: {t.dataKey}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {t.columns.slice(0, 5).map((c: any) => (
                              <span key={c.key} className="text-[9px] px-1 py-0.5 rounded" style={{ background: LC.border, color: LC.textSecondary }}>{c.label}</span>
                            ))}
                            {t.columns.length > 5 && <span className="text-[9px] text-lc-text-muted">+{t.columns.length - 5}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <a href={`/api/export/${t.dataKey}`} target="_blank"
                              className="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-lc-primary-light text-lc-primary" title="导出">
                              <Download size={13} />
                            </a>
                            <button
                              className="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-lc-danger/10 text-lc-danger"
                              onClick={() => { setDeletingKey(t.dataKey); deleteMutation.mutate({ dataKey: t.dataKey }); }}
                              title="删除数据"
                              disabled={deletingKey === t.dataKey}
                            >
                              {deletingKey === t.dataKey ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {activeKeys.length === 0 && (
            <div className="rounded-xl ring-1 ring-lc-border bg-white p-12 text-center">
              <FolderOpen size={40} className="mx-auto mb-3" style={{ color: 'LC.textMuted' }} />
              <p className="text-sm text-lc-text-muted">暂无已入库数据</p>
              <p className="text-[11px] mt-1" style={{ color: 'LC.textMuted' }}>切换到「数据上传」标签开始导入</p>
            </div>
          )}

          {/* Uploaded Files */}
          {fileListData && fileListData.files.length > 0 && (
            <div className="rounded-xl ring-1 ring-lc-border bg-white overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: LC.border, background: '#FAF8F6' }}>
                <span className="text-xs font-semibold text-lc-text-primary">上传记录</span>
                <span className="text-[10px] text-lc-text-muted">{fileListData.files.length} 个文件</span>
              </div>
              <table className="w-full text-[10px]">
                <tbody>
                  {fileListData.files.map(f => (
                    <tr key={f.id} className="border-b hover:bg-[#FAF8F6] transition-colors border-lc-border-light">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet size={12} className="text-lc-success" />
                          <span className="font-medium text-lc-text-primary" title={f.originalName}>
                            {f.originalName.length > 35 ? f.originalName.slice(0, 35) + '...' : f.originalName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-lc-text-secondary">
                        {(f.rowCount ?? 0).toLocaleString()} 行
                      </td>
                      <td className="py-2.5 px-3 text-lc-text-muted">
                        {new Date(f.uploadedAt).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
