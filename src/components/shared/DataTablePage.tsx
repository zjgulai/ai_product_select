/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, memo, type ReactNode } from 'react';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { LC } from '@/lib/lute-colors';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, ChevronLeft, ChevronRight, ArrowRight, Inbox } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';

export interface ColumnConfig<T = any> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  render?: (item: T, index: number) => ReactNode;
}

interface DataTablePageProps<T = any> {
  breadcrumb: string[];
  title: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  tabs?: { key: string; label: string }[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  extraHeader?: ReactNode;
  loading?: boolean;
  data?: T[];
  total?: number;
  columns: ColumnConfig<T>[];
  rowKey?: string | ((item: T) => string | number);
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  exportable?: boolean;
  emptyText?: string;
  children?: ReactNode;
  rowActions?: (item: T) => ReactNode;
  lastUpdated?: string;
  dataSource?: string;
}

function DataTablePage<T = any>({
  breadcrumb,
  title,
  searchPlaceholder = '搜索...',
  searchValue = '',
  onSearchChange,
  tabs,
  activeTab,
  onTabChange,
  extraHeader,
  loading = false,
  data = [],
  total = 0,
  columns,
  rowKey = 'id',
  page = 0,
  pageSize = 20,
  onPageChange,
  exportable = false,
  emptyText = '暂无数据',
  rowActions,
  children,
  lastUpdated,
  dataSource,
}: DataTablePageProps<T>) {
  const totalPages = Math.ceil(total / pageSize);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    if (debouncedSearch !== searchValue) {
      onSearchChange?.(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange, searchValue]);

  const getRowKey = (item: T, idx: number): string | number => {
    if (typeof rowKey === 'function') return rowKey(item);
    if (typeof rowKey === 'string' && item && typeof item === 'object') {
      return (item as any)[rowKey] ?? idx;
    }
    return idx;
  };

  const getCellClass = (col: ColumnConfig<T>) => {
    const base = 'py-3 px-4 text-[13px] ';
    if (col.align === 'right') return base + 'text-right';
    if (col.align === 'center') return base + 'text-center';
    return base + 'text-left';
  };

  const getHeaderClass = (col: ColumnConfig<T>) => {
    const base = 'py-3 px-4 text-xs font-semibold uppercase tracking-wide ';
    if (col.align === 'right') return base + 'text-right';
    if (col.align === 'center') return base + 'text-center';
    return base + 'text-left';
  };

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={breadcrumb} />

      {/* Search + Tabs Header */}
      {(onSearchChange || tabs) && (
        <div className="bg-white rounded-t-lg shadow-lc border-b px-4 pt-3 ring-1 ring-lc-border/60" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FDF8F6 100%)' }}>
          {onSearchChange && (
            <div className="flex items-center gap-0 mb-3">
              <div className="relative flex-1 max-w-[400px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lc-text-muted" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-9 pl-9 pr-3 rounded-l-full border border-r-0 text-xs transition-all focus:outline-none focus:ring-1 border-lc-border text-lc-text-primary"
                  style={{ background: '#FFFFFF' }}
                />
              </div>
              <button className="h-9 px-6 text-white text-xs font-medium rounded-r-full transition-all hover:brightness-110 bg-lc-primary" style={{ boxShadow: '0 8px 18px rgba(215,92,112,0.14)' }}>
                搜索
              </button>
            </div>
          )}
          {tabs && (
            <div className="flex gap-6">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => onTabChange?.(t.key)}
                  className="pb-2.5 text-xs font-medium transition-all border-b-2"
                  style={activeTab === t.key
                    ? { color: LC.primary, borderColor: LC.primary }
                    : { color: LC.textMuted, borderColor: 'transparent' }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Extra Header (filters, banners, etc.) */}
      {extraHeader}

      {/* Table Container */}
        <div className="bg-white rounded-b-lg shadow-lc overflow-hidden ring-1 ring-lc-border/60" style={{ boxShadow: '0 10px 24px rgba(53,20,26,0.04)' }}>
        {/* Table Header */}
        <div className="flex items-center justify-between p-3 border-b border-lc-border">
          <h3 className="text-sm font-semibold text-lc-primary">{title}</h3>
          <div className="flex items-center gap-3">
            {dataSource && <span className="text-xs text-lc-text-muted" title="数据来源">来源: {dataSource}</span>}
            {lastUpdated && <span className="text-xs text-lc-text-muted" title="数据更新时间">更新: {lastUpdated}</span>}
            <span className="text-xs font-medium text-lc-text-muted">共 {total} 条</span>
            {exportable && (
              <button onClick={() => { import('sonner').then(({ toast }) => toast.success('数据导出中…')); }} className="flex items-center gap-1 text-xs font-medium text-lc-primary">
                <Download size={12} /> 数据导出
              </button>
            )}
          </div>
        </div>

        {/* Custom content (optional, replaces table) */}
        {children ? (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              children
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    {columns.slice(0, 6).map((_col, ci) => (
                      <Skeleton key={ci} className={`h-4 ${ci === 0 ? 'w-8' : ci === 1 ? 'w-32' : 'w-20'}`} />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-lc-bg-warm">
                    {columns.map(col => (
                      <th key={col.key} className={getHeaderClass(col)} style={{ color: LC.textSecondary }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={getRowKey(item, idx)} className="border-b border-lc-border-light hover:bg-lc-bg-warm transition-colors group">
                      {columns.map(col => (
                        <td key={col.key} className={getCellClass(col)}>
                          {col.render ? col.render(item, idx) : (item as any)[col.key]}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="py-2.5 px-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {rowActions(item)}
                        </td>
                      )}
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={columns.length}>
                        <EmptyState compact icon={Inbox} title={emptyText} description={dataSource ? `数据来源: ${dataSource}` : undefined} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination */}
        {onPageChange && totalPages > 0 && (
          <div className="flex items-center justify-between p-3 border-t border-lc-border">
            <span className="text-xs font-medium text-lc-text-muted">
              共 {total} 条 · 第 {page + 1} / {totalPages} 页
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPageChange(Math.max(0, page - 1))}
                disabled={page === 0}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-lc-border"
                style={{ color: page === 0 ? '#D6D3D0' : LC.textMuted }}
              >
                <ChevronLeft size={12} />
              </button>
              {(() => {
                const range: number[] = [];
                const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                const end = Math.min(totalPages, start + 5);
                for (let i = start; i < end; i++) range.push(i);
                return range.map(p => (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium"
                    style={page === p
                      ? { background: LC.primary, color: '#fff' }
                      : { border: `1px solid ${LC.border}`, color: LC.textSecondary }
                    }
                  >
                    {p + 1}
                  </button>
                ));
              })()}
              <button
                onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-lc-border"
                style={{ color: page >= totalPages - 1 ? '#D6D3D0' : LC.textMuted }}
              >
                <ChevronRight size={12} />
              </button>
              {totalPages > 5 && (
                <div className="flex items-center gap-1 ml-1">
                  <input
                    data-jump-page
                    type="text"
                    inputMode="numeric"
                    placeholder={`${page + 1}`}
                    className="w-10 h-7 text-center text-xs rounded-md border border-lc-border focus:outline-none focus:ring-1 focus:ring-lc-primary"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const v = parseInt((e.target as HTMLInputElement).value, 10);
                        if (!isNaN(v) && v >= 1 && v <= totalPages) onPageChange(v - 1);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('[data-jump-page]') as HTMLInputElement;
                      const v = parseInt(input?.value || '', 10);
                      if (!isNaN(v) && v >= 1 && v <= totalPages) onPageChange(v - 1);
                      if (input) input.value = '';
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-lc-border text-lc-text-muted hover:text-lc-primary transition-colors"
                  >
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(DataTablePage) as typeof DataTablePage;
