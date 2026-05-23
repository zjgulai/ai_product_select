import { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';

const NAV_ITEMS = [
  { label: "首页", href: "/tiktok/home" },
  { label: "Boost Claw", href: "#", badge: "NEW" },
  { label: "开放平台", href: "#", badge: "NEW" },
  { label: "AI选品", href: "/amazon/keyword" },
  { label: "达人建联", href: "/tiktok/influencer" },
  { label: "AI视频", href: "/tiktok/video" },
  { label: "产品中心", href: "#", hasDropdown: true },
  { label: "客户案例", href: "#" },
  { label: "资源中心", href: "#", hasDropdown: true },
  { label: "关于我们", href: "#" },
];

export default function TopNavigation() {
  const [activeNav, setActiveNav] = useState("AI选品");

  return (
    <nav className="fixed top-0 left-0 right-0 h-12 z-[100] flex items-center px-4"
      style={{ background: 'linear-gradient(90deg, #0A0A0A 0%, #1A1A1A 100%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 mr-6 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#E8785A' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 3h7v7H3V3zm11 0h7v4h-7V3zM3 14h4v7H3v-4zm7-4h11v4H10v-4zm0 7h7v4h-7v-4z" fill="#0A0A0A"/>
          </svg>
        </div>
        <span className="text-white font-bold text-sm tracking-wide">路特</span>
        <span className="text-[8px] font-bold px-1 py-0.5 rounded-sm tracking-wider" style={{ background: '#E8785A', color: '#1C1917' }}>AI</span>
      </div>

      {/* Nav Items */}
      <div className="flex items-center gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => (
          <button key={item.label} onClick={() => setActiveNav(item.label)}
            className={`relative px-3 h-12 flex items-center gap-1 text-[13px] transition-all duration-200 ${activeNav === item.label ? 'text-white font-semibold' : 'text-white/50 hover:text-white/80'}`}>
            {item.label}
            {item.badge && <span className="text-[8px] font-bold ml-0.5 tracking-wider" style={{ color: '#E8785A' }}>NEW</span>}
            {item.hasDropdown && <ChevronDown size={11} className="text-white/30" />}
            {activeNav === item.label && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t" style={{ background: '#E8785A' }} />
            )}
          </button>
        ))}
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="text-xs px-5 h-7 rounded-full font-bold transition-all duration-200 hover:brightness-110"
          style={{ background: '#E8785A', color: '#1C1917' }}>
          免费体验
        </button>
        <button className="flex items-center gap-1 text-white/40 text-xs hover:text-white/70 transition-colors">
          <Globe size={13} /><span>中文</span><ChevronDown size={11} />
        </button>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#E8785A' }}>
          <span className="text-xs font-bold" style={{ color: '#1C1917' }}>U</span>
        </div>
      </div>
    </nav>
  );
}
