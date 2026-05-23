import { useLocation, useNavigate } from 'react-router';
import { Home, BarChart3, ShoppingBag, Users, Store, Play, Video, Star, Search, Trophy, FileText, Heart, Settings, ChevronDown, Crown, PersonStanding, Database, Sparkles } from 'lucide-react';

const TIKTOK_MENU = [
  { icon: Home, label: "首页", path: "/tiktok/home" },
  { icon: BarChart3, label: "大盘", path: "/tiktok/analysis" },
  { icon: ShoppingBag, label: "商品", path: "/tiktok/products" },
  { icon: Users, label: "达人", path: "/tiktok/influencer" },
  { icon: Store, label: "小店", path: "/tiktok/shop" },
  { icon: Play, label: "视频", path: "/tiktok/video" },
  { icon: Video, label: "直播", path: "/tiktok/live" },
  { icon: Star, label: "关注", path: "/tiktok/attention" },
];

const AMAZON_MENU = [
  { icon: Search, label: "关键词趋势", path: "/amazon/keyword" },
  { icon: Trophy, label: "Amazon榜单", path: "/amazon/list" },
  { icon: ShoppingBag, label: "商品搜索", path: "/amazon/product" },
  { icon: FileText, label: "我的报告", path: "/report/analysis" },
  { icon: PersonStanding, label: "用户中心", path: "/user/center" },
  { icon: Heart, label: "我的关注", path: "/tiktok/attention" },
  { icon: Database, label: "数据管理", path: "/data/manager" },
  { icon: Settings, label: "设置", path: "/user/center" },
];

const FUSION_MENU = [
  { icon: Sparkles, label: "选品机会榜", path: "/fusion/opportunities" },
  { icon: FileText, label: "生成报告", path: "/fusion/report" },
];

const neonBg = '#E8785A';
const neonText = '#0A0A0A';

export default function LeftSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-12 bottom-0 w-[168px] z-[90] flex flex-col overflow-y-auto"
      style={{ background: '#0A0A0A' }}>
      {/* TikTok Group */}
      <div className="px-2 pt-3 pb-1">
        <button className="flex items-center gap-1.5 px-2 py-1.5 text-white/60 text-[13px] font-medium w-full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="white"/></svg>
          <span>TikTok趋势</span>
          <ChevronDown size={12} className="ml-auto text-white/20" />
        </button>
        <div className="mt-0.5">
          {TIKTOK_MENU.map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-md text-[12px] transition-all duration-200"
              style={isActive(item.path)
                ? { background: neonBg, color: neonText, fontWeight: 600 }
                : { color: 'rgba(255,255,255,0.45)', background: 'transparent' }}
              onMouseEnter={e => { if (!isActive(item.path)) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.8)'; }}}
              onMouseLeave={e => { if (!isActive(item.path)) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.45)'; }}}>
              <item.icon size={15} strokeWidth={1.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-3 my-2 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Amazon Group */}
      <div className="px-2 pt-1 pb-1">
        <button className="flex items-center gap-1.5 px-2 py-1.5 text-white/60 text-[13px] font-medium w-full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2 4h4v4H2V4zm6 0h4v4H8V4zm6 0h4v4h-4V4zM2 10h4v4H2v-4zm6 0h4v4H8v-4zm6 0h4v4h-4v-4zM2 16h4v4H2v-4zm6 0h4v4H8v-4zm6 0h4v4h-4v-4z" fill="white"/></svg>
          <span>Amazon趋势</span>
          <ChevronDown size={12} className="ml-auto text-white/20" />
        </button>
        <div className="mt-0.5">
          {AMAZON_MENU.map(item => (
            <button key={item.label} onClick={() => item.path !== '#' && navigate(item.path)}
              className="flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-md text-[12px] transition-all duration-200"
              style={isActive(item.path)
                ? { background: neonBg, color: neonText, fontWeight: 600 }
                : { color: 'rgba(255,255,255,0.45)', background: 'transparent' }}
              onMouseEnter={e => { if (!isActive(item.path)) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.8)'; }}}
              onMouseLeave={e => { if (!isActive(item.path)) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.45)'; }}}>
              <item.icon size={15} strokeWidth={1.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-3 my-2 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Fusion Group */}
      <div className="px-2 pt-1 pb-1">
        <button className="flex items-center gap-1.5 px-2 py-1.5 text-white/60 text-[13px] font-medium w-full">
          <Sparkles size={14} strokeWidth={1.5} className="text-white/40" />
          <span>融合选品</span>
          <span className="text-[8px] font-bold ml-0.5 tracking-wider" style={{ color: '#E8785A' }}>NEW</span>
        </button>
        <div className="mt-0.5">
          {FUSION_MENU.map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-md text-[12px] transition-all duration-200"
              style={isActive(item.path)
                ? { background: neonBg, color: neonText, fontWeight: 600 }
                : { color: 'rgba(255,255,255,0.45)', background: 'transparent' }}
              onMouseEnter={e => { if (!isActive(item.path)) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.8)'; }}}
              onMouseLeave={e => { if (!isActive(item.path)) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.45)'; }}}>
              <item.icon size={15} strokeWidth={1.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <div className="p-2.5 pb-3 space-y-2">
        <button className="w-full rounded-md py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(90deg, #E8785A, #D49450)', color: '#1C1917' }}>
          <Crown size={13} strokeWidth={1.5} /> 升级会员
        </button>
        <div className="rounded-md p-2.5 space-y-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-white/60 text-[10px] font-medium">13680382537</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-sm font-bold tracking-wider" style={{ background: neonBg, color: neonText }}>高级版</span>
          </div>
          <div className="text-white/25 text-[9px]">2026-04-22 套餐到期</div>
        </div>
      </div>
    </aside>
  );
}
