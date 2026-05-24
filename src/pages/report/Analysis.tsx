import { useState, useMemo } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { REPORT_KPI, REPORT_KEYWORDS, WORD_CLOUD, REVIEW_ASPECTS } from '@/data/mockData';
import { useBatchDynamicData } from '@/hooks/useBatchDynamicData';
import { LC } from '@/lib/lute-colors';
import { CATEGORY_SHARE, MONTHLY_GMV } from '@/data/industryData';
import EChartsPie from '@/components/shared/EChartsPie';
import EChartsLine from '@/components/shared/EChartsLine';
import EChartsBar from '@/components/shared/EChartsBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Share2, BarChart3, X, Check, Star } from 'lucide-react';
import DataBadge from '@/components/shared/DataBadge';

const TABS = ["市场概况", "商品样本", "关键词验证", "参数解构", "评价分析", "评论洞察", "商品对比"];

const BRAND_DATA = [
  { name: 'momcozy', value: 42.5 }, { name: 'medela', value: 10.2 },
  { name: 'dr browns', value: 5.7 }, { name: 'philips', value: 5.2 },
  { name: 'nanobebe', value: 4.2 }, { name: 'others', value: 32.2 },
];
const PRICE_DATA = [{ name: '其他', value: 8.5 }, { name: '$0-$45', value: 34.3 }, { name: '>$45', value: 57.2 }];
// Chart colors available: ['#E8785A', '#D49450', LC.teal, '#A8A29E', '#16A34A', '#C4D4E0']
const PRODUCT_IMAGES = ["/assets/products/p6.jpg", "/assets/products/p5.jpg", "/assets/products/p1.jpg"];

const SAMPLE_PRODUCTS = [
  { name: 'Momcozy KleanPal Pro', asin: 'B0C1234567', brand: 'momcozy', price: 299.99, rating: 4.6, sales: 15234, reviews: 4521, img: 0 },
  { name: 'Momcozy Bottle Warmer', asin: 'B0C2345678', brand: 'momcozy', price: 42.99, rating: 4.4, sales: 12890, reviews: 3892, img: 0 },
  { name: 'Momcozy Breast Pump M5', asin: 'B0C3456789', brand: 'momcozy', price: 199.99, rating: 4.7, sales: 11567, reviews: 3245, img: 1 },
  { name: 'Dr Brown Bottles Set', asin: 'B0D4567890', brand: 'dr browns', price: 24.99, rating: 4.5, sales: 9876, reviews: 2876, img: 2 },
  { name: 'Medela Symphony Pump', asin: 'B0E5678901', brand: 'medela', price: 249.99, rating: 4.3, sales: 8765, reviews: 2109, img: 1 },
  { name: 'Philips Avent Warmer', asin: 'B0F6789012', brand: 'philips', price: 34.99, rating: 4.2, sales: 7654, reviews: 1890, img: 2 },
  { name: 'Nanobebe Breast Pump', asin: 'B0G7890123', brand: 'nanobebe', price: 19.99, rating: 4.1, sales: 6543, reviews: 1543, img: 1 },
  { name: 'Tommee Tippee Warmer', asin: 'B0H8901234', brand: 'tommee', price: 18.99, rating: 4.3, sales: 5432, reviews: 1321, img: 0 },
  { name: 'Lansinoh Smart Pump', asin: 'B0I9012345', brand: 'lansinoh', price: 89.99, rating: 4.0, sales: 4321, reviews: 987, img: 1 },
  { name: 'Comotomo Baby Bottle', asin: 'B0J0123456', brand: 'comotomo', price: 21.99, rating: 4.5, sales: 3210, reviews: 876, img: 2 },
];

export default function ReportAnalysis() {
  const { results: db } = useBatchDynamicData([
    { dataKey: 'report_kpi', mockData: REPORT_KPI },
    { dataKey: 'report_keywords', mockData: REPORT_KEYWORDS },
    { dataKey: 'report_review_aspects', mockData: REVIEW_ASPECTS },
  ]);
  const reportKpi = db['report_kpi'].records as { label: string; value: string }[];
  const reportKeywords = db['report_keywords'].records as { keyword: string; rank: number; ctr: number; volume: number; difficulty: string }[];
  const reviewAspects = db['report_review_aspects'].records as { aspect: string; count: number; ratio: string; desc: string }[];

  // VOC核心：接入真实评论统计数据（以第一个ASIN为示例）
  const sampleAsin = 'B0C1234567'; // 示例ASIN
  const { data: vocStats, isLoading: vocLoading, isError } = trpc.amazon.reviews.stats.useQuery({ asin: sampleAsin });
  const [activeTab, setActiveTab] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [expandedAspect, setExpandedAspect] = useState<number | null>(null);
  const t = (msg: string) => { import('sonner').then(({ toast }) => toast.success(msg)); };

  const toggleProduct = (i: number) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const priceTrendData = useMemo(() => [
    { month: '2025-07', '>$45': 120, '$0-$45': 80, '>$45_new': 15, '$0-$45_new': 22 },
    { month: '2025-08', '>$45': 135, '$0-$45': 90, '>$45_new': 18, '$0-$45_new': 28 },
    { month: '2025-09', '>$45': 150, '$0-$45': 100, '>$45_new': 22, '$0-$45_new': 32 },
    { month: '2025-10', '>$45': 140, '$0-$45': 95, '>$45_new': 28, '$0-$45_new': 38 },
    { month: '2025-11', '>$45': 160, '$0-$45': 110, '>$45_new': 35, '$0-$45_new': 42 },
    { month: '2025-12', '>$45': 175, '$0-$45': 120, '>$45_new': 40, '$0-$45_new': 45 },
    { month: '2026-01', '>$45': 155, '$0-$45': 105, '>$45_new': 25, '$0-$45_new': 30 },
    { month: '2026-02', '>$45': 162, '$0-$45': 108, '>$45_new': 30, '$0-$45_new': 35 },
    { month: '2026-03', '>$45': 170, '$0-$45': 115, '>$45_new': 38, '$0-$45_new': 40 },
  ], []);

  if (isError) return <ErrorState />;

  return (
    <div className="animate-fadeIn relative">
      <Breadcrumb items={["我的首页", "产品分析报告"]} />

      <div className="flex items-center gap-2 px-4 py-2 bg-lc-bg-warm border-b border-lc-border-light">
        <DataBadge type="demo" label="报告数据为演示用途" />
        <span className="text-xs text-lc-text-muted">实际数据需接入 Amazon SP-API / 评论爬虫</span>
      </div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-lc-primary">美国站 &apos;momcozy baby bottle warmer&apos; 产品分析报告</h2>
              <button className="transition-colors text-lc-text-muted hover:text-lc-primary"><Share2 size={16} /></button>
            </div>
            <div className="flex items-center gap-4 text-xs flex-wrap">
              {[{l:'商品数量',v:'212'},{l:'品牌数量',v:'101'},{l:'已分析评论数',v:'14,319'},{l:'创建日期',v:'2026-04-20'},{l:'更新时间',v:'2026-04-20'}].map(i => (
                <span key={i.l}><span className="text-lc-text-muted">{i.l}: </span><span className="font-semibold text-lc-text-primary">{i.v}</span></span>
              ))}
            </div>
          </div>
          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-1.5 text-xs text-white px-4 h-8 rounded-md font-medium bg-lc-primary">
            <Download size={12} /> 导出报告
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-lc-primary">导出报告</h3>
              <button onClick={() => setShowExportModal(false)}><X size={16} className="text-lc-text-muted" /></button>
            </div>
            <div className="space-y-2">
              {['PDF报告（完整）','Excel数据表','PPT摘要','Word文档'].map(fmt => (
                <button key={fmt} onClick={() => { t(`正在生成${fmt}...`); setShowExportModal(false); }}
                  className="w-full text-left px-4 py-3 rounded-lg border text-xs font-medium transition-all hover:shadow-sm" style={{ borderColor: LC.border, color: LC.text }}>{fmt}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow-lc border-b px-4 pt-3 mb-4 ring-1 ring-lc-border/60">
        <div className="flex gap-5 overflow-x-auto">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} className="pb-2.5 text-xs font-medium transition-all border-b-2 whitespace-nowrap"
              style={activeTab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ===== TAB 0: 市场概况 ===== */}
      {activeTab === 0 && (
        <>
          <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
            <h3 className="text-sm font-semibold mb-4 text-lc-primary">市场概况</h3>
            <div className="grid grid-cols-6 gap-3">
              {reportKpi.map(kpi => (
                <div key={kpi.label} className="rounded-lg p-3 bg-lc-bg-warm">
                  <div className="text-[11px] font-medium mb-1 text-lc-text-muted">{kpi.label}</div>
                  <div className="text-sm font-bold font-mono-num text-lc-primary">{kpi.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly GMV */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
              <h3 className="text-sm font-semibold mb-3 text-lc-primary">月度GMV趋势</h3>
              <EChartsLine data={MONTHLY_GMV.map(d => ({ x: d.month.slice(5), y: d.gmv }))} color={'#E8785A'} height={240} yAxisName="$B" />
            </div>
            <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
              <h3 className="text-sm font-semibold mb-3 text-lc-primary">品类市场份额</h3>
              <EChartsPie data={CATEGORY_SHARE.slice(0, 6).map(c => ({ name: c.name, value: c.value }))} height={240} donut />
            </div>
          </div>

          {/* Word Cloud */}
          <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
            <h3 className="text-sm font-semibold mb-4 text-lc-primary">关键词词云</h3>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 min-h-[200px] px-6">
              {WORD_CLOUD.map((word, i) => {
                const colors = ['#E8785A', '#D49450', LC.teal, '#A8A29E', '#16A34A'];
                return (
                  <span key={i} className="cursor-pointer hover:opacity-60 transition-opacity font-medium"
                    style={{ fontSize: `${Math.max(12, word.size * 0.35)}px`, color: colors[i % colors.length], fontWeight: word.size > 35 ? 700 : word.size > 25 ? 600 : 400 }}>
                    {word.text}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Sample Products with Images */}
          <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
            <h3 className="text-sm font-semibold mb-4 text-lc-primary">商品样本</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {SAMPLE_PRODUCTS.slice(0, 10).map((p, i) => (
                <div key={i} className="shrink-0 w-[72px] text-center cursor-pointer group">
                  <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden ring-1 ring-lc-border mb-1.5 group-hover:ring-lc-primary transition-all">
                    <img src={PRODUCT_IMAGES[p.img]} alt="" className="w-full h-full object-cover"  onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%23C8C3BC'%3E📷%3C/text%3E%3C/svg%3E"; }}/>
                  </div>
                  <div className="text-[9px] font-medium truncate text-lc-text-secondary">{p.name.slice(0, 12)}</div>
                  <div className="text-[8px] font-medium" style={{ color: LC.success }}>Sales {p.sales.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords with progress bars */}
          <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
            <h3 className="text-sm font-semibold mb-4 text-lc-primary">关键词验证</h3>
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-lc-bg-warm">
                  {["关键词", "搜索排名", "点击集中度", "搜索趋势"].map(h => <th key={h} className={`py-2 px-3 text-xs font-semibold text-lc-text-secondary ${h === '关键词' ? 'text-left' : 'text-right'}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {reportKeywords.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-lc-bg-warm border-lc-border-light">
                    <td className="py-2 px-3 text-xs font-semibold text-lc-primary">{item.keyword}</td>
                    <td className="py-2 px-3 text-right text-xs font-mono-num font-bold text-lc-primary">{item.rank}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden bg-lc-border-light">
                          <div className="h-full rounded-full" style={{ width: `${item.ctr}%`, background: item.ctr > 50 ? LC.danger : item.ctr > 30 ? LC.warning : LC.primary }} />
                        </div>
                        <span className="text-xs font-mono-num text-lc-text-muted">{item.ctr}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-sm" style={{ background: `${LC.success}10`, color: LC.success }}>↑ 上升</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Parameters - Donut Charts */}
          <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
            <h3 className="text-sm font-semibold mb-4 text-lc-primary">参数解构</h3>
            <div className="grid grid-cols-3 gap-6">
              <EChartsPie data={BRAND_DATA} title="品牌" height={200} donut />
              <EChartsPie data={PRICE_DATA} title="价格带" height={200} donut />
              <EChartsPie data={[
                { name: 'white', value: 28.9 }, { name: 'green', value: 21.6 }, { name: 'gray', value: 16.8 },
                { name: 'black', value: 14.6 }, { name: 'pink', value: 5.9 }, { name: 'others', value: 12.2 },
              ]} title="颜色" height={200} donut />
            </div>
          </div>
        </>
      )}

      {/* ===== TAB 1: 商品样本 ===== */}
      {activeTab === 1 && (
        <div className="bg-white rounded-lg shadow-lc p-6 ring-1 ring-lc-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-lc-primary">商品样本 ({selectedProducts.size} 已选)</h3>
            <div className="flex gap-2">
              <button onClick={() => setSelectedProducts(new Set())} className="text-xs px-3 h-7 rounded border" style={{ color: LC.textSecondary, borderColor: LC.border }}>清空选择</button>
              <button onClick={() => t(`已选择 ${selectedProducts.size} 个商品进行对比`)} className="text-xs text-white px-3 h-7 rounded font-medium" style={{ background: selectedProducts.size > 1 ? LC.primary : LC.borderStrong }}>去对比</button>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {SAMPLE_PRODUCTS.map((p, i) => (
              <div key={i} onClick={() => toggleProduct(i)} className={`relative border rounded-lg p-3 text-center cursor-pointer transition-all hover:shadow-lc-hover ${selectedProducts.has(i) ? 'ring-2' : ''}`}
                style={{ borderColor: selectedProducts.has(i) ? LC.primary : LC.border, boxShadow: selectedProducts.has(i) ? `0 0 0 2px ${LC.primary}30` : undefined }}>
                {selectedProducts.has(i) && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center bg-lc-primary"><Check size={12} /></div>}
                <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden ring-1 ring-lc-border mb-2">
                  <img src={PRODUCT_IMAGES[p.img]} alt="" className="w-full h-full object-cover"  onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%23C8C3BC'%3E📷%3C/text%3E%3C/svg%3E"; }}/>
                </div>
                <div className="text-xs font-medium truncate text-lc-text-primary">{p.name}</div>
                <div className="text-xs font-mono-num mt-1 text-lc-text-muted">{p.asin}</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xs font-bold text-lc-primary">${p.price}</span>
                  <span className="text-xs font-semibold" style={{ color: p.rating >= 4.5 ? LC.success : LC.teal }}><Star size={12} className="text-lc-gold fill-lc-gold" />{p.rating}</span>
                </div>
                <div className="text-xs font-mono-num mt-0.5" style={{ color: LC.success }}>Sales: {p.sales.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB 2: 关键词验证 ===== */}
      {activeTab === 2 && (
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
          <h3 className="text-sm font-semibold mb-4 text-lc-primary">关键词验证 - 扩展列表</h3>
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-lc-bg-warm">
                {["关键词", "搜索排名", "月搜索量", "点击集中度", "竞争度", "趋势"].map(h => (
                  <th key={h} className={`py-2 px-3 text-xs font-semibold text-lc-text-secondary ${h === '关键词' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportKeywords.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-lc-bg-warm border-lc-border-light">
                  <td className="py-2 px-3 text-xs font-semibold text-lc-primary">{item.keyword}</td>
                  <td className="py-2 px-3 text-right text-xs font-mono-num font-bold text-lc-primary">{item.rank}</td>
                  <td className="py-2 px-3 text-right text-xs font-mono-num text-lc-text-secondary">{(100000 - idx * 15000).toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">
                    <span className="text-xs font-mono-num font-semibold" style={{ color: item.ctr > 50 ? LC.danger : LC.primary }}>{item.ctr}</span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 rounded-full overflow-hidden bg-lc-border-light">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.ctr)}%`, background: item.ctr > 50 ? LC.danger : item.ctr > 30 ? LC.warning : LC.success }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right"><span className="text-xs font-medium px-1.5 py-0.5 rounded-sm" style={{ background: `${LC.success}10`, color: LC.success }}>↑</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== TAB 3: 参数解构 ===== */}
      {activeTab === 3 && (
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
          <h3 className="text-sm font-semibold mb-4 text-lc-primary">参数解构 - 详细分析</h3>
          <div className="mb-6">
            <h4 className="text-xs font-semibold mb-2 text-lc-text-secondary">价格带销量趋势</h4>
            <EChartsLine data={priceTrendData.map(d => ({ x: d.month.slice(5), y: d['>$45'] + d['$0-$45'] }))} color={'#D49450'} height={260} yAxisName="销量(K)" />
          </div>
          <div className="mb-6">
            <h4 className="text-xs font-semibold mb-2 text-lc-text-secondary">新品占比趋势</h4>
            <EChartsBar data={priceTrendData.map(d => ({ label: d.month.slice(5), value: d['>$45_new'] + d['$0-$45_new'] }))} color={LC.teal} height={220} yAxisName="新品数" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <EChartsPie data={PRICE_DATA} title="价格带分布" height={200} donut />
            <EChartsPie data={BRAND_DATA} title="品牌份额" height={200} donut />
          </div>
        </div>
      )}

      {/* ===== TAB 4: 评价分析 (VOC核心) ===== */}
      {activeTab === 4 && (
        <>
          {/* VOC情感概览 */}
          <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
            <h3 className="text-sm font-semibold mb-4 text-lc-primary">评论情感分析</h3>
            {vocLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : vocStats ? (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg p-3 text-center bg-lc-bg-warm">
                  <div className="text-[11px] font-medium mb-1 text-lc-text-muted">总评论数</div>
                  <div className="text-lg font-bold font-mono-num text-lc-text-primary">{vocStats.total.toLocaleString()}</div>
                </div>
                <div className="rounded-lg p-3 text-center bg-lc-success/10">
                  <div className="text-[11px] font-medium mb-1 text-lc-success">好评</div>
                  <div className="text-lg font-bold font-mono-num text-lc-success">{vocStats.positive.toLocaleString()}</div>
                  <div className="text-xs text-lc-success">{((vocStats.positive / vocStats.total) * 100).toFixed(1)}%</div>
                </div>
                <div className="rounded-lg p-3 text-center bg-lc-danger/10">
                  <div className="text-[11px] font-medium mb-1 text-lc-danger">差评</div>
                  <div className="text-lg font-bold font-mono-num text-lc-danger">{vocStats.negative.toLocaleString()}</div>
                  <div className="text-xs text-lc-danger">{((vocStats.negative / vocStats.total) * 100).toFixed(1)}%</div>
                </div>
                <div className="rounded-lg p-3 text-center bg-lc-warning/10">
                  <div className="text-[11px] font-medium mb-1 text-lc-warning">平均评分</div>
                  <div className="text-lg font-bold font-mono-num text-lc-warning">{vocStats.avgRating}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
            <h3 className="text-sm font-semibold mb-4 text-lc-primary">好评点标签云</h3>
            <div className="flex flex-wrap items-center gap-2">
              {reviewAspects.map((aspect, i) => (
                <button key={i} onClick={() => setExpandedAspect(expandedAspect === i ? null : i)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                  style={{ fontSize: `${Math.max(11, 11 + parseFloat(aspect.ratio) * 0.2)}px`, backgroundColor: i < 3 ? `${LC.primary}10` : `${LC.border}40`, color: i < 3 ? LC.primary : LC.textSecondary }}>
                  {aspect.aspect} <span className="font-semibold">{aspect.ratio}</span>
                </button>
              ))}
            </div>
            {expandedAspect !== null && (
              <div className="mt-3 p-3 rounded-lg bg-lc-bg-warm">
                <p className="text-xs text-lc-text-secondary"><strong className="text-lc-text-primary">{REVIEW_ASPECTS[expandedAspect].aspect}</strong>: {REVIEW_ASPECTS[expandedAspect].desc} ({REVIEW_ASPECTS[expandedAspect].count} 条评论)</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-lc-primary">评价维度分析</h3>
              <button onClick={() => setShowReviewModal(true)} className="flex items-center gap-1.5 text-xs text-white px-3 h-7 rounded-md font-medium bg-lc-primary">
                <BarChart3 size={12} /> 样本评论分析
              </button>
            </div>
            {vocLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : vocStats?.aspects ? (
              <div className="mb-4">
                <EChartsBar data={vocStats.aspects.slice(0, 10).map((a: any) => ({ label: a.aspect, value: a.total }))} color={'#E8785A'} height={220} horizontal />
              </div>
            ) : (
              <div className="mb-4">
                <EChartsBar data={reviewAspects.map(a => ({ label: a.aspect, value: a.count }))} color={'#E8785A'} height={220} horizontal />
              </div>
            )}
          </div>

          {showReviewModal && (
            <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center" onClick={() => setShowReviewModal(false)}>
              <div className="bg-white rounded-lg w-[80vw] h-[80vh] overflow-hidden shadow-xl animate-slideUp ring-1" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-lc-border">
                  <h3 className="text-sm font-semibold text-lc-primary">样本评论分析</h3>
                  <button onClick={() => setShowReviewModal(false)} className="text-lc-text-muted"><X size={18} /></button>
                </div>
                <div className="p-4 overflow-auto h-[calc(80vh-60px)]">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="bg-lc-bg-warm">
                        {["商品图片","商品","好评点","吐槽点","使用场景"].map(h => <th key={h} className="py-2 px-3 text-xs font-semibold text-left text-lc-text-secondary">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { product: "Momcozy KleanPal Pro", positive: "便携,快速,易用", negative: "价格高", scenario: "旅行使用", img: 0 },
                        { product: "Momcozy Portable Warmer", positive: "便携,设计好", negative: "容量小", scenario: "日常使用", img: 0 },
                        { product: "Momcozy Bottle Washer", positive: "快速,易用", negative: "噪音大", scenario: "家用", img: 1 },
                      ].map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-lc-bg-warm border-lc-border-light">
                          <td className="py-2 px-3"><img src={PRODUCT_IMAGES[item.img]} alt="" className="w-10 h-10 rounded object-cover ring-1 ring-lc-border"  onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%23C8C3BC'%3E📷%3C/text%3E%3C/svg%3E"; }}/></td>
                          <td className="py-2 px-3 text-xs font-medium text-lc-text-primary">{item.product}</td>
                          <td className="py-2 px-3 text-xs font-medium" style={{ color: LC.success }}>{item.positive}</td>
                          <td className="py-2 px-3 text-xs" style={{ color: LC.danger }}>{item.negative}</td>
                          <td className="py-2 px-3"><span className="text-xs px-1.5 py-0.5 rounded-sm font-medium" style={{ background: `${LC.primary}10`, color: LC.primary }}>{item.scenario}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== TAB 5: 评论洞察 ===== */}
      {activeTab === 5 && (
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
          <h3 className="text-sm font-semibold mb-4 text-lc-primary">评论洞察</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold mb-3 text-lc-text-secondary">使用场景分布</h4>
              <EChartsBar data={[
                { label: "旅行外出", value: 712 }, { label: "日常家用", value: 660 },
                { label: "产品使用", value: 520 }, { label: "睡前使用", value: 506 },
                { label: "工作间隙", value: 313 },
              ]} color={LC.primary} height={200} horizontal />
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3 text-lc-text-secondary">使用时间分布</h4>
              <EChartsPie data={[
                { name: '日常', value: 44.3 }, { name: '睡前', value: 19.9 },
                { name: '工作间隙', value: 16.5 }, { name: '旅行', value: 14.2 }, { name: '其他', value: 5.1 },
              ]} height={200} donut />
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB 6: 商品对比 ===== */}
      {activeTab === 6 && (
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
          <h3 className="text-sm font-semibold mb-4 text-lc-primary">商品对比</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SAMPLE_PRODUCTS.slice(0, 4).map((item, idx) => (
              <div key={idx} className="border rounded-lg p-3 transition-all hover:shadow-lc-hover border-lc-border">
                <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden ring-1 ring-lc-border mb-3">
                  <img src={PRODUCT_IMAGES[item.img]} alt="" className="w-full h-full object-cover"  onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%23C8C3BC'%3E📷%3C/text%3E%3C/svg%3E"; }}/>
                </div>
                <div className="text-xs font-semibold mb-2 min-h-[32px] text-lc-text-primary">{item.name}</div>
                <div className="space-y-1">
                  {[{l:'ASIN',v:item.asin,c:LC.textSecondary},{l:'品牌',v:item.brand,c:LC.text},{l:'价格',v:`$${item.price}`,c:LC.primary},{l:'评分',v:`<Star size={12} className="text-lc-gold fill-lc-gold" />${item.rating}`,c:item.rating>=4.5?LC.success:LC.teal},{l:'销量',v:item.sales.toLocaleString(),c:LC.success},{l:'评论',v:item.reviews.toLocaleString(),c:LC.textSecondary}].map(f => (
                    <div key={f.l} className="flex justify-between text-[11px]"><span className="text-lc-text-muted">{f.l}</span><span className="font-mono-num font-medium" style={{ color: f.c }}>{f.v}</span></div>
                  ))}
                </div>
                <div className="mt-3">
                  {[{t:'好评点',items:['便携','快速','易用'],bg:`${LC.success}10`,tc:LC.success},{t:'使用场景',items:['旅行','日常'],bg:`${LC.primary}10`,tc:LC.gold}].map(g => (
                    <div key={g.t} className="mb-1.5">
                      <div className="text-xs mb-0.5 text-lc-text-muted">{g.t}</div>
                      <div className="flex flex-wrap gap-1">{g.items.map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-sm font-medium" style={{ background: g.bg, color: g.tc }}>{t}</span>)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
