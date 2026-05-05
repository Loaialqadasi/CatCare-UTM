'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import type { AppView } from '@/lib/types';

import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentEmergencies } from '@/components/dashboard/recent-emergencies';
import { RecentCats } from '@/components/dashboard/recent-cats';

import { CatList } from '@/components/cats/cat-list';
import { CatDetail } from '@/components/cats/cat-detail';
import { CreateCatForm } from '@/components/cats/create-cat-form';

import { EmergencyList } from '@/components/emergencies/emergency-list';
import { EmergencyDetail } from '@/components/emergencies/emergency-detail';
import { CreateEmergencyForm } from '@/components/emergencies/create-emergency-form';

import { UserProfile } from '@/components/profile/user-profile';

function DashboardView() {
  return (
    <div className="space-y-6">
      <StatsCards />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentEmergencies />
        <RecentCats />
      </div>
    </div>
  );
}

function AuthRouter({ view }: { view: AppView }) {
  switch (view) {
    case 'register':
      return <RegisterForm />;
    case 'login':
    default:
      return <LoginForm />;
  }
}

function AppRouter({ view }: { view: AppView }) {
  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'cats':
      return <CatList />;
    case 'cat-detail':
      return <CatDetail />;
    case 'create-cat':
      return <CreateCatForm />;
    case 'emergencies':
      return <EmergencyList />;
    case 'emergency-detail':
      return <EmergencyDetail />;
    case 'create-emergency':
      return <CreateEmergencyForm />;
    case 'profile':
      return <UserProfile />;
    default:
      return <DashboardView />;
  }
}

export default function Home() {
  const { currentView, isAuthenticated, sidebarOpen, setSidebarOpen, toggleSidebar } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync sidebar collapsed state with screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // Auth views (no layout)
  if (!isAuthenticated) {
    return <AuthRouter view={currentView} />;
  }

  // App views with layout
  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div
        className="transition-all duration-300"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (sidebarCollapsed ? '68px' : '240px') : '0' }}
      >
        <Header onMenuClick={toggleSidebar} />

        <main className="p-4 sm:p-6 lg:p-8">
          <AppRouter view={currentView} />
        </main>
      </div>
    </div>
  );
}
