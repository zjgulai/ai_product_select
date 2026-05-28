import { useNavigate } from 'react-router';
import { Home, AlertTriangle } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${LC.primary}15` }}>
        <AlertTriangle size={32} style={{ color: LC.primary }} />
      </div>
      <h1 className="text-2xl font-bold text-lc-text-primary">404</h1>
      <p className="text-sm text-lc-text-muted max-w-[280px]">
        页面不存在或已被移除
      </p>
      <button
        onClick={() => navigate('/tiktok/home')}
        className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-medium transition-all hover:brightness-110"
        style={{ background: LC.primary, color: LC.textInverse }}
      >
        <Home size={14} />
        返回首页
      </button>
    </div>
  );
}
