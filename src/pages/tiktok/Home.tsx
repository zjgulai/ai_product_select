import { useState } from 'react';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Users, Store, Play, Video, ChevronRight, Search } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

const ENTRIES = [
  { icon: ShoppingBag, title: "找商品", placeholder: "搜索商品", links: ["昨日销量最高的商品", "昨日销量环比最高的商品", "30日内上架销量最高的商品"] },
  { icon: Users, title: "找达人", placeholder: "搜索达人", links: ["近30日带货销售额最多的达人", "近30日粉丝增长数最多的达人"] },
  { icon: Store, title: "找小店", placeholder: "搜索小店", links: ["近7日销量最高的小店", "近7日销量环比增长最多的小店"] },
  { icon: Play, title: "找视频", placeholder: "搜索视频", links: ["近30日发布播放量最高的视频", "近30日发布销量最高的视频"] },
  { icon: Video, title: "找直播", placeholder: "搜索直播", links: ["近30日累计观看人次最多的直播", "近30日涨粉数最高的直播"] },
];

const PRODUCT_IMAGES = [
  "/assets/products/p1.jpg", "/assets/products/p2.jpg", "/assets/products/p3.jpg",
  "/assets/products/p4.jpg", "/assets/products/p5.jpg",
];

const AVATAR_IMAGES = [
  "/assets/avatars/a1.jpg", "/assets/avatars/a2.jpg", "/assets/avatars/a3.jpg",
];

export default function TikTokHome() {
  const [productTab, setProductTab] = useState(0);
  const [influencerTab, setInfluencerTab] = useState(0);
  const [shopTab, setShopTab] = useState(0);
  const [videoTab, setVideoTab] = useState(0);
  const [liveTab, setLiveTab] = useState(0);

  // tRPC queries - all in parallel
  const { data: productsHot, isLoading: pHotLoading } = trpc.tiktok.home.productsHot.useQuery();
  const { data: productsSoaring, isLoading: pSoarLoading } = trpc.tiktok.home.productsSoaring.useQuery();
  const { data: productsNew, isLoading: pNewLoading } = trpc.tiktok.home.productsNew.useQuery();
  const { data: influencersSales, isLoading: iSalesLoading } = trpc.tiktok.home.influencersSales.useQuery();
  const { data: influencersFans, isLoading: iFansLoading } = trpc.tiktok.home.influencersFans.useQuery();
  const { data: shopsHot, isLoading: sLoading } = trpc.tiktok.home.shopsHot.useQuery();
  const { data: videosHot, isLoading: vLoading } = trpc.tiktok.home.videosHot.useQuery();
  const { data: livesPopular, isLoading: lLoading } = trpc.tiktok.home.livesPopular.useQuery();

  const productTabs = ["商品热销榜", "商品飙升榜", "商品新品榜"];
  const productData = [productsHot || [], productsSoaring || [], productsNew || []];
  const influencerTabs = ["达人带货榜", "达人涨粉榜"];
  const influencerData = [influencersSales || [], influencersFans || []];
  const isLoading = [pHotLoading, pSoarLoading, pNewLoading, iSalesLoading, iFansLoading, sLoading, vLoading, lLoading].some(Boolean);

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={["TikTok趋势", "首页"]} />

      {/* Entry Cards */}
      <div className="bg-white rounded-lg shadow-lc p-4 mb-4">
        <div className="grid grid-cols-5 gap-4">
          {ENTRIES.map((entry, i) => (
            <div key={i} className="bg-[#F7F8F9] rounded-lg p-3 ring-1 ring-lc-border hover:shadow-lc-hover hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${LC.primary}12` }}>
                  <entry.icon size={17} className="text-lc-primary" />
                </div>
                <span className="text-sm font-semibold text-lc-primary">{entry.title}</span>
              </div>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lc-text-muted" />
                <input type="text" placeholder={entry.placeholder}
                  className="w-full h-8 pl-8 pr-3 rounded-full border text-xs transition-all focus:outline-none focus:ring-1"
                  style={{ borderColor: LC.border, color: LC.text, background: LC.textInverse }}
                  onFocus={e => { e.target.style.borderColor = LC.primary; }}
                  onBlur={e => e.target.style.borderColor = LC.border}
                />
              </div>
              <div className="space-y-1">
                {entry.links.map((link, j) => (
                  <button key={j} className="flex items-center text-[11px] transition-colors w-full group text-lc-text-muted"
                    onMouseEnter={e => { e.currentTarget.classList.add('text-lc-primary'); e.currentTarget.classList.remove('text-lc-text-muted'); }}
                    onMouseLeave={e => { e.currentTarget.classList.remove('text-lc-primary'); e.currentTarget.classList.add('text-lc-text-muted'); }}>
                    <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
                    <span className="truncate">{link}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product & Influencer Rankings */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Product Rankings */}
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-lc-primary">商品榜单</h3>
            <button className="text-xs font-medium flex items-center gap-0.5 transition-colors text-lc-primary"
              onMouseEnter={e => e.currentTarget.classList.add('text-lc-primary-dark')}
              onMouseLeave={e => e.currentTarget.classList.add('text-lc-primary')}>
              完整榜单 <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex gap-4 border-b mb-3 border-lc-border">
            {productTabs.map((tab, i) => (
              <button key={tab} onClick={() => setProductTab(i)}
                className="pb-2 text-xs font-medium transition-all border-b-2"
                style={productTab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>
                {tab}
              </button>
            ))}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full">
              <tbody>
                {productData[productTab].map((item: any) => (
                  <tr key={item.rank} className="border-b last:border-0 transition-colors hover:bg-lc-bg-warm border-lc-border-light">
                    <td className="py-2 w-10">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        item.rank <= 3 ? "text-white" : "text-lc-text-muted" }`}
                        style={item.rank <= 3 ? { background: item.rank === 1 ? LC.gold : item.rank === 2 ? '#D6D3D0' : '#D4A080' } : { background: LC.border }}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <img src={PRODUCT_IMAGES[(item.rank - 1) % PRODUCT_IMAGES.length]} alt="" className="w-8 h-8 rounded object-cover ring-1 ring-lc-border" />
                        <div>
                          <div className="text-xs truncate max-w-[160px] text-lc-text-primary" title={item.name}>{item.name}</div>
                          <div className="text-[10px] text-lc-text-muted">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-right text-xs font-semibold font-mono-num text-lc-text-primary">{item.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Influencer Rankings */}
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-lc-primary">达人榜单</h3>
            <button className="text-xs font-medium flex items-center gap-0.5 text-lc-primary">
              完整榜单 <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex gap-4 border-b mb-3 border-lc-border">
            {influencerTabs.map((tab, i) => (
              <button key={tab} onClick={() => setInfluencerTab(i)}
                className="pb-2 text-xs font-medium transition-all border-b-2"
                style={influencerTab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>
                {tab}
              </button>
            ))}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full">
              <tbody>
                {influencerData[influencerTab].map((item: any) => (
                  <tr key={item.rank} className="border-b last:border-0 hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                    <td className="py-2 w-10">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${item.rank <= 3 ? 'text-white' : 'text-lc-text-muted'}`}
                        style={item.rank <= 3 ? { background: item.rank === 1 ? LC.gold : item.rank === 2 ? '#D6D3D0' : '#D4A080' } : { background: LC.border }}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <img src={AVATAR_IMAGES[(item.rank - 1) % AVATAR_IMAGES.length]} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-lc-border" />
                        <span className="text-xs text-lc-text-primary">{item.username}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right text-xs font-semibold font-mono-num text-lc-text-primary">{item.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Shop & Video Rankings */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Shop Rankings */}
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-lc-primary">小店榜单</h3>
            <button className="text-xs font-medium flex items-center gap-0.5 text-lc-primary">完整榜单 <ChevronRight size={12} /></button>
          </div>
          <div className="flex gap-4 border-b mb-3 border-lc-border">
            {["小店热销榜", "小店飙升榜"].map((tab, i) => (
              <button key={tab} onClick={() => setShopTab(i)}
                className="pb-2 text-xs font-medium transition-all border-b-2"
                style={shopTab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>{tab}</button>
            ))}
          </div>
          {sLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full">
              <tbody>
                {shopsHot?.map((item: any) => (
                  <tr key={item.rank} className="border-b last:border-0 hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                    <td className="py-2 w-10">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${item.rank <= 3 ? 'text-white' : 'text-lc-text-muted'}`}
                        style={item.rank <= 3 ? { background: item.rank === 1 ? LC.gold : item.rank === 2 ? '#D6D3D0' : '#D4A080' } : { background: LC.border }}>{item.rank}</span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <img src="/assets/shops/s1.jpg" alt="" className="w-6 h-6 rounded object-cover ring-1 ring-lc-border" />
                        <div>
                          <div className="text-xs text-lc-text-primary">{item.name}</div>
                          <div className="text-[10px] text-lc-text-muted">{item.country}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-right text-xs font-semibold font-mono-num text-lc-text-primary">{item.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Video Rankings */}
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-lc-primary">视频榜单</h3>
            <button className="text-xs font-medium flex items-center gap-0.5 text-lc-primary">完整榜单 <ChevronRight size={12} /></button>
          </div>
          <div className="flex gap-4 border-b mb-3 border-lc-border">
            {["视频热播榜", "视频热销榜"].map((tab, i) => (
              <button key={tab} onClick={() => setVideoTab(i)}
                className="pb-2 text-xs font-medium transition-all border-b-2"
                style={videoTab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>{tab}</button>
            ))}
          </div>
          {vLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full">
              <tbody>
                {videosHot?.map((item: any) => (
                  <tr key={item.rank} className="border-b last:border-0 hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                    <td className="py-2 w-10">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${item.rank <= 3 ? 'text-white' : 'text-lc-text-muted'}`}
                        style={item.rank <= 3 ? { background: item.rank === 1 ? LC.gold : item.rank === 2 ? '#D6D3D0' : '#D4A080' } : { background: LC.border }}>{item.rank}</span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-[30px] rounded flex items-center justify-center text-[10px] ring-1 ring-lc-border relative overflow-hidden bg-lc-bg-warm">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                          <span className="absolute bottom-0 right-0 text-[7px] px-1 rounded-tl" style={{ background: 'rgba(0,0,0,0.7)', color: LC.textInverse }}>{item.duration}</span>
                        </div>
                        <div>
                          <div className="text-xs truncate max-w-[140px] text-lc-text-primary" title={item.title}>{item.title}</div>
                          <div className="text-[10px] text-lc-text-muted">{item.date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-right text-xs font-semibold font-mono-num text-lc-text-primary">{item.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Live Rankings */}
      <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-lc-primary">直播榜单</h3>
          <button className="text-xs font-medium flex items-center gap-0.5 text-lc-primary">完整榜单 <ChevronRight size={12} /></button>
        </div>
        <div className="flex gap-4 border-b mb-3 border-lc-border">
          {["直播人气榜", "直播涨粉榜"].map((tab, i) => (
            <button key={tab} onClick={() => setLiveTab(i)} className="pb-2 text-xs font-medium transition-all border-b-2" style={{ color: liveTab === i ? LC.primary : LC.textMuted, borderColor: liveTab === i ? LC.primary : 'transparent' }}>{tab}</button>
          ))}
        </div>
        {lLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {livesPopular?.map((item: any) => (
              <div key={item.rank} className="flex items-center gap-3 py-2 border-b last:border-0 border-lc-border-light">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${item.rank <= 3 ? 'text-white' : 'text-lc-text-muted'}`}
                  style={item.rank <= 3 ? { background: item.rank === 1 ? LC.gold : item.rank === 2 ? '#D6D3D0' : '#D4A080' } : { background: LC.border }}>{item.rank}</span>
                <img src="/assets/products/p1.jpg" alt="" className="w-9 h-7 rounded object-cover ring-1 ring-lc-border" />
                <div className="flex-1 min-w-0"><div className="text-xs truncate text-lc-text-primary">{item.title}</div></div>
                <div className="text-xs font-semibold font-mono-num shrink-0 text-lc-text-primary">{item.viewers}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white rounded-lg shadow-lc p-6 mt-4 ring-1 ring-lc-border/60">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-lc-primary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 3h7v7H3V3zm11 0h7v4h-7V3zM3 14h4v7H3v-4zm7-4h11v4H10v-4zm0 7h7v4h-7v-4z" fill="LC.teal"/></svg>
              </div>
              <span className="text-sm font-semibold text-lc-primary">路特 AI</span>
            </div>
            <p className="text-xs text-lc-text-muted">跨境增长AI大数据解决方案，就选路特</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-lc-text-muted">© 路特创新</p>
            <p className="text-xs text-lc-border-strong">浙ICP备2022015040号</p>
          </div>
        </div>
      </div>
    </div>
  );
}
