import { useState } from 'react';
import { Outlet } from 'react-router';
import TopNavigation from './TopNavigation';
import LeftSidebar from './LeftSidebar';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page">
      <TopNavigation onMenuToggle={() => setMobileMenuOpen(v => !v)} />
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <LeftSidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main className="md:ml-[168px] ml-0 mt-12 min-h-[calc(100vh-48px)]" style={{ background: '#F5EDE8' }}>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
