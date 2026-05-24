import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Home, Sparkles, BarChart3, ShoppingBag, Users, Store, Play, Video, Search,
  Trophy, FileText, Heart, Settings, ChevronDown, ChevronRight, Crown,
  PersonStanding, Database, Radar, Briefcase, Zap, TrendingUp
} from 'lucide-react';

interface MenuItem {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  path: string;
  badge?: string;
}

interface MenuGroup {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  items: MenuItem[];
  defaultOpen?: boolean;
}

const MENU_GROUPS: MenuGroup[] = [
  {
    label: "工作台",
    icon: Home,
    defaultOpen: true,
    items: [
      { icon: Home, label: "首页", path: "/tiktok/home" },
    ],
  },
  {
    label: "发现机会",
    icon: Radar,
    defaultOpen: true,
    items: [
      { icon: Sparkles, label: "选品机会榜", path: "/fusion/opportunities", badge: "核心" },
      { icon: BarChart3, label: "TikTok大盘", path: "/tiktok/analysis" },
      { icon: ShoppingBag, label: "商品趋势", path: "/tiktok/products" },
      { icon: Users, label: "达人发现", path: "/tiktok/influencer" },
      { icon: Store, label: "小店排行", path: "/tiktok/shop" },
      { icon: Play, label: "热门视频", path: "/tiktok/video" },
      { icon: Video, label: "直播排行", path: "/tiktok/live" },
      { icon: Search, label: "Amazon关键词", path: "/amazon/keyword" },
      { icon: Trophy, label: "Amazon榜单", path: "/amazon/list" },
    ],
  },
  {
    label: "评估分析",
    icon: TrendingUp,
    defaultOpen: false,
    items: [
      { icon: Heart, label: "关注监控", path: "/tiktok/attention" },
      { icon: Database, label: "数据管理", path: "/data/manager" },
      { icon: Zap, label: "生成报告", path: "/fusion/report" },
    ],
  },
  {
    label: "决策执行",
    icon: Briefcase,
    defaultOpen: false,
    items: [
      { icon: FileText, label: "我的报告", path: "/report/analysis" },
      { icon: Briefcase, label: "项目跟踪", path: "/project/tracking", badge: "IPMS" },
      { icon: PersonStanding, label: "用户中心", path: "/user/center" },
      { icon: Settings, label: "系统设置", path: "/user/center" },
    ],
  },
];

const neonBg = '#E8785A';
const neonText = '#0A0A0A';

interface LeftSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function LeftSidebar({ mobileOpen, onClose }: LeftSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MENU_GROUPS.forEach(g => { initial[g.label] = g.defaultOpen ?? false; });
    return initial;
  });

  const isActive = (path: string) => location.pathname === path;

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className={`fixed left-0 top-12 bottom-0 w-[180px] z-[90] flex-col overflow-y-auto transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:flex`}
      style={{ background: '#0A0A0A' }}
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      {MENU_GROUPS.map((group, groupIdx) => (
        <div key={group.label}>
          {groupIdx > 0 && (
            <div className="mx-3 my-2 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          )}
          <div className="px-2 pt-2 pb-1">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.label)}
              className="flex items-center gap-2 px-2 py-1.5 text-white/50 text-[12px] font-medium w-full hover:text-white/70 transition-colors"
            >
              <group.icon size={13} strokeWidth={1.5} />
              <span>{group.label}</span>
              {openGroups[group.label] ? (
                <ChevronDown size={12} className="ml-auto text-white/20" />
              ) : (
                <ChevronRight size={12} className="ml-auto text-white/20" />
              )}
            </button>

            {/* Group Items */}
            {openGroups[group.label] && (
              <div className="mt-0.5">
                {group.items.map(item => (
                  <button
                    key={item.path + item.label}
                    onClick={() => navigate(item.path)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-md text-[12px] transition-all duration-200"
                    style={isActive(item.path)
                      ? { background: neonBg, color: neonText, fontWeight: 600 }
                      : { color: 'rgba(255,255,255,0.45)', background: 'transparent' }}
                    onMouseEnter={e => { if (!isActive(item.path)) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}}
                    onMouseLeave={e => { if (!isActive(item.path)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}}>
                    <item.icon size={15} strokeWidth={1.5} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[8px] font-bold ml-auto tracking-wider" style={{ color: '#E8785A' }}>{item.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex-1" />

      {/* Bottom user card + upgrade */}
      <div className="p-2.5 pb-3 space-y-2">
        <button className="w-full rounded-md py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(90deg, #E8785A, #D49450)', color: '#1C1917' }}>
          <Crown size={13} strokeWidth={1.5} /> 升级会员
        </button>
        <div className="rounded-md p-2.5 space-y-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-white/60 text-xs font-medium">lute_user_001</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-sm font-bold tracking-wider" style={{ background: neonBg, color: neonText }}>高级版</span>
          </div>
          <div className="text-white/25 text-[9px]">2027-12-31 套餐到期</div>
        </div>
      </div>
    </aside>
  );
}
