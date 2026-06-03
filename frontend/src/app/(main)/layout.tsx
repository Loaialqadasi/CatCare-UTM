'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getMe, logout as apiLogout } from '@/lib/api-client';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setUser, logout } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();

  // Stable refs so the effect doesn't re-run when these identity-change
  const setUserRef = useRef(setUser);
  const logoutRef = useRef(logout);
  const routerRef = useRef(router);
  useEffect(() => { setUserRef.current = setUser; }, [setUser]);
  useEffect(() => { logoutRef.current = logout; }, [logout]);
  useEffect(() => { routerRef.current = router; }, [router]);

  // Validate session — re-runs when isAuthenticated changes
  const hasValidated = useRef(false);
  useEffect(() => {
    if (hasValidated.current) return;
    hasValidated.current = true;

    if (isAuthenticated) {
      getMe()
        .then((user) => setUserRef.current(user))
        .catch(() => {
          apiLogout().catch(() => {});
          logoutRef.current();
          routerRef.current.push('/login');
        });
    } else {
      routerRef.current.push('/login');
    }
  }, [isAuthenticated]);

  // Keep-alive ping
  useEffect(() => {
    if (!isAuthenticated || !API_BASE) return;
    const PING_INTERVAL = 4 * 60 * 1000;
    const ping = () => {
      fetch(`${API_BASE}/health`, { method: 'GET' }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, PING_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-primary focus:text-primary-foreground">
        Skip to content
      </a>
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={handleToggleCollapse} />
      <div className="transition-all duration-300" style={{ marginLeft: 'var(--sidebar-offset, 0px)' }}>
        <Header onMenuClick={() => {}} />
        <main id="main" className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
