import { Outlet } from 'react-router';
import TopNavigation from './TopNavigation';
import LeftSidebar from './LeftSidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-page">
      <TopNavigation />
      <LeftSidebar />
      <main className="ml-[168px] mt-12 min-h-[calc(100vh-48px)]">
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
