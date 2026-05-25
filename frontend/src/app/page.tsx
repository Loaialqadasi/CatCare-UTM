// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

'use client';

import { useState, useEffect, lazy, Suspense, Component, ReactNode } from 'react';
import { useAppStore } from '@/lib/store';
import type { AppView } from '@/lib/types';
import { getMe, logout as apiLogout } from '@/lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://catcare-backend.onrender.com/api';

import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';

// CRIT-6 Fix: Lazy-load all page components to reduce initial bundle size
const StatsCards = lazy(() => import('@/components/dashboard/stats-cards').then(m => ({ default: m.StatsCards })));
const RecentEmergencies = lazy(() => import('@/components/dashboard/recent-emergencies').then(m => ({ default: m.RecentEmergencies })));
const RecentCats = lazy(() => import('@/components/dashboard/recent-cats').then(m => ({ default: m.RecentCats })));

const CatList = lazy(() => import('@/components/cats/cat-list').then(m => ({ default: m.CatList })));
const CatDetail = lazy(() => import('@/components/cats/cat-detail').then(m => ({ default: m.CatDetail })));
const CreateCatForm = lazy(() => import('@/components/cats/create-cat-form').then(m => ({ default: m.CreateCatForm })));

const EmergencyList = lazy(() => import('@/components/emergencies/emergency-list').then(m => ({ default: m.EmergencyList })));
const EmergencyDetail = lazy(() => import('@/components/emergencies/emergency-detail').then(m => ({ default: m.EmergencyDetail })));
const CreateEmergencyForm = lazy(() => import('@/components/emergencies/create-emergency-form').then(m => ({ default: m.CreateEmergencyForm })));

const MyDonations = lazy(() => import('@/components/donations/my-donations').then(m => ({ default: m.MyDonations })));
const DonationDetail = lazy(() => import('@/components/donations/donation-detail').then(m => ({ default: m.DonationDetail })));
const CreateDonationForm = lazy(() => import('@/components/donations/create-donation-form').then(m => ({ default: m.CreateDonationForm })));
const AdminDonationDashboard = lazy(() => import('@/components/donations/admin-donation-dashboard').then(m => ({ default: m.AdminDonationDashboard })));

const UserProfile = lazy(() => import('@/components/profile/user-profile').then(m => ({ default: m.UserProfile })));

// MIN-2 Fix: Error Boundary to catch render crashes
interface ErrorBoundaryProps { children: ReactNode }
interface ErrorBoundaryState { error: Error | null }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Page skeleton for Suspense fallback
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

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
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        {(() => {
          switch (view) {
            case 'dashboard': return <DashboardView />;
            case 'cats': return <CatList />;
            case 'cat-detail': return <CatDetail />;
            case 'create-cat': return <CreateCatForm />;
            case 'emergencies': return <EmergencyList />;
            case 'emergency-detail': return <EmergencyDetail />;
            case 'create-emergency': return <CreateEmergencyForm />;
            case 'my-donations': return <MyDonations />;
            case 'donation-detail': return <DonationDetail />;
            case 'create-donation': return <CreateDonationForm />;
            case 'admin-donations': return <AdminDonationDashboard />;
            case 'profile': return <UserProfile />;
            default: return <DashboardView />;
          }
        })()}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function Home() {
  const { currentView, isAuthenticated, sidebarOpen, setSidebarOpen, toggleSidebar, setUser, logout } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // CRIT-1 Fix: Validate session on app load via HttpOnly cookie
  useEffect(() => {
    if (isAuthenticated) {
      getMe()
        .then((user) => setUser(user))
        .catch(() => {
          // Session expired or invalid — clear on both sides
          apiLogout().catch(() => {}); // clear the HttpOnly cookie server-side
          logout(); // clear the client-side state
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // MED-1 Fix: Keep-alive ping to prevent Render cold starts
  useEffect(() => {
    if (!isAuthenticated || !API_BASE) return;
    const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes (Render sleeps after 15 min inactivity)
    const ping = () => {
      fetch(`${API_BASE}/health`, { method: 'GET' }).catch(() => {});
    };
    // Initial ping
    ping();
    const interval = setInterval(ping, PING_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // on small screens the sidebar should never be collapsed
  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // MIN-6 Fix: Use CSS custom property to avoid layout shift
  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty(
        '--sidebar-offset',
        isDesktop ? (sidebarCollapsed ? '68px' : '240px') : '0px'
      );
    }
  }, [isDesktop, sidebarCollapsed, mounted]);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // not logged in? show login/register screens
  if (!isAuthenticated) {
    return <AuthRouter view={currentView} />;
  }

  // logged in — show the main app with sidebar + header
  return (
    <div className="min-h-screen bg-background">
      {/* MIN-10 Fix: Accessibility skip link */}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-primary focus:text-primary-foreground">
        Skip to content
      </a>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div
        className="transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-offset, 0px)' }}
      >
        <Header onMenuClick={toggleSidebar} />

        <main id="main" className="p-4 sm:p-6 lg:p-8">
          <AppRouter view={currentView} />
        </main>
      </div>
    </div>
  );
}
