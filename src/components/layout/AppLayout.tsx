import { useState } from 'react';
import { Outlet } from 'react-router';
import TopNavigation from './TopNavigation';
import LeftSidebar from './LeftSidebar';
import { LC } from '@/lib/lute-colors';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: LC.bg }}>
      <TopNavigation onMenuToggle={() => setMobileMenuOpen(v => !v)} />
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[80] md:hidden backdrop-blur-[1px]" style={{ background: 'rgba(53,20,26,0.12)' }} onClick={() => setMobileMenuOpen(false)} />
      )}
      <LeftSidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main className="md:ml-[180px] ml-0 mt-12 min-h-[calc(100vh-48px)]" style={{ background: LC.bgWarm }}>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
