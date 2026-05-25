import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ChevronDown, Globe, Sparkles, Menu } from 'lucide-react';
import { toast } from 'sonner';

interface DropdownItem {
  label: string;
  href: string;
  badge?: string;
}

interface NavItem {
  label: string;
  href: string;
  isPrimary?: boolean;
  dropdown?: DropdownItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "工作台",
    href: "/tiktok/home",
  },
  {
    label: "选品工作台",
    href: "/fusion/opportunities",
    isPrimary: true,
  },
  {
    label: "TikTok趋势",
    href: "/tiktok/analysis",
    dropdown: [
      { label: "大盘分析", href: "/tiktok/analysis" },
      { label: "商品趋势", href: "/tiktok/products" },
      { label: "达人发现", href: "/tiktok/influencer" },
      { label: "小店排行", href: "/tiktok/shop" },
      { label: "热门视频", href: "/tiktok/video" },
      { label: "直播排行", href: "/tiktok/live" },
    ],
  },
  {
    label: "Amazon市场",
    href: "/amazon/keyword",
    dropdown: [
      { label: "关键词趋势", href: "/amazon/keyword" },
      { label: "Amazon榜单", href: "/amazon/list" },
      { label: "商品搜索", href: "/amazon/product" },
      { label: "市场深度", href: "/amazon/hot-market", badge: "NEW" },
    ],
  },
  {
    label: "报告中心",
    href: "/report/analysis",
    dropdown: [
      { label: "我的报告", href: "/report/analysis" },
      { label: "生成报告", href: "/fusion/report" },
      { label: "数据管理", href: "/data/manager" },
    ],
  },
  {
    label: "个人中心",
    href: "/user/center",
  },
];

interface TopNavigationProps {
  onMenuToggle?: () => void;
}

export default function TopNavigation({ onMenuToggle }: TopNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine active nav item based on current path
  const getActiveItem = () => {
    const path = location.pathname;
    for (const item of NAV_ITEMS) {
      if (path === item.href) return item.label;
      if (item.dropdown) {
        for (const d of item.dropdown) {
          if (path === d.href) return item.label;
        }
      }
    }
    return "工作台";
  };

  const activeNav = getActiveItem();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (item: NavItem) => {
    if (item.dropdown) {
      setOpenDropdown(openDropdown === item.label ? null : item.label);
    } else {
      navigate(item.href);
      setOpenDropdown(null);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-12 z-[100] flex items-center px-4"
      style={{ background: 'linear-gradient(90deg, #1A1212 0%, #2A1A1A 100%)' }}>
      {/* Mobile Menu Button */}
      {onMenuToggle && (
        <button onClick={onMenuToggle} className="md:hidden mr-3 text-white/60 hover:text-white transition-colors">
          <Menu size={20} />
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-2 mr-6 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#8B354A' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 3h7v7H3V3zm11 0h7v4h-7V3zM3 14h4v7H3v-4zm7-4h11v4H10v-4zm0 7h7v4h-7v-4z" fill="#1A1212"/>
          </svg>
        </div>
        <span className="text-white font-bold text-sm tracking-wide">路特</span>
        <span className="text-[8px] font-bold px-1 py-0.5 rounded-sm tracking-wider" style={{ background: '#8B354A', color: '#2D1F1F' }}>AI</span>
      </div>

      {/* Nav Items */}
      <div className="flex items-center gap-0.5 flex-1" ref={dropdownRef}>
        {NAV_ITEMS.map((item) => (
          <div key={item.label} className="relative">
            <button
              onClick={() => handleNavClick(item)}
              className={`relative px-3 h-12 flex items-center gap-1 text-[13px] transition-all duration-200 ${
                activeNav === item.label
                  ? 'text-white font-semibold'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {item.isPrimary && <Sparkles size={12} style={{ color: '#8B354A' }} />}
              {item.label}
              {item.dropdown && (
                <ChevronDown
                  size={11}
                  className={`text-white/30 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`}
                />
              )}
              {activeNav === item.label && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t" style={{ background: '#8B354A' }} />
              )}
            </button>

            {/* Dropdown menu */}
            {item.dropdown && openDropdown === item.label && (
              <div className="absolute top-full left-0 mt-1 w-44 rounded-lg overflow-hidden border shadow-xl"
                style={{
                  background: '#2A1A1A',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}>
                {item.dropdown.map((d) => (
                  <button
                    key={d.label}
                    onClick={() => {
                      navigate(d.href);
                      setOpenDropdown(null);
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 text-[12px] text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    <span>{d.label}</span>
                    {d.badge && (
                      <span className="text-[9px] font-bold tracking-wider" style={{ color: '#8B354A' }}>{d.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/fusion/opportunities')}
          className="text-xs px-5 h-7 rounded-full font-bold transition-all duration-200 hover:brightness-110"
          style={{ background: '#8B354A', color: '#2D1F1F' }}>
          免费体验
        </button>
        <button
          onClick={() => toast.info('多语言支持即将上线')}
          className="flex items-center gap-1 text-white/40 text-xs hover:text-white/70 transition-colors">
          <Globe size={13} /><span>中文</span><ChevronDown size={11} />
        </button>
        <button
          onClick={() => navigate('/user/center')}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:brightness-110"
          style={{ background: '#8B354A' }}>
          <span className="text-xs font-bold" style={{ color: '#2D1F1F' }}>U</span>
        </button>
      </div>
    </nav>
  );
}
