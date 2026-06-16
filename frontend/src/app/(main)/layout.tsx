'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
import { useAppStore, rehydrateAuth } from '@/lib/store';
import { getMe, startTokenRefreshTimer, stopTokenRefreshTimer } from '@/lib/api-client';
=======
import { useAppStore } from '@/lib/store';
import { getMe, logout as apiLogout } from '@/lib/api-client';
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function MainLayout({ children }: { children: React.ReactNode }) {
<<<<<<< HEAD
  const { isAuthenticated, setUser } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hydrated, setHydrated] = useState(false);
=======
  const { isAuthenticated, setUser, logout } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e
  const router = useRouter();

  // Stable refs so the effect doesn't re-run when these identity-change
  const setUserRef = useRef(setUser);
<<<<<<< HEAD
  const routerRef = useRef(router);
  useEffect(() => { setUserRef.current = setUser; }, [setUser]);
  useEffect(() => { routerRef.current = router; }, [router]);

  // Step 1: Rehydrate Zustand store from localStorage BEFORE any auth checks.
  // Without this, the store always starts with isAuthenticated=false on page reload,
  // causing an immediate redirect to /login before the persisted state loads.
  useEffect(() => {
    rehydrateAuth().then(() => setHydrated(true));
  }, []);

  // Step 2: Validate session — only after hydration is complete
  const hasValidated = useRef(false);
  useEffect(() => {
    if (!hydrated) return; // Wait for localStorage rehydration
    if (hasValidated.current) return;
    hasValidated.current = true;

    // Read the LATEST state from the store (after rehydration)
    const { isAuthenticated: isAuth } = useAppStore.getState();

    if (!isAuth) {
      routerRef.current.push('/login');
      return;
    }

    // Validate session in background — don't block the UI or force logout on failure.
    // The 401 interceptor in api-client handles token refresh automatically.
    // Only redirect to login if the session is definitely invalid.
    getMe()
      .then((user) => setUserRef.current(user))
      .catch(() => {
        // Session validation failed — but don't immediately force logout.
        // The 401 interceptor already tried to refresh. If it succeeded, we're fine.
        // If it failed, the interceptor already called storeLogout().
        // Re-read the current state to check if the interceptor logged us out.
        const { isAuthenticated: stillAuth } = useAppStore.getState();
        if (!stillAuth) {
          routerRef.current.push('/login');
        }
      });
  }, [hydrated]);

  // Proactive token refresh — refresh every 12 min (token lasts 15 min)
  useEffect(() => {
    if (!hydrated) return;
    const { isAuthenticated: isAuth } = useAppStore.getState();
    if (!isAuth) return;
    startTokenRefreshTimer();
    return () => stopTokenRefreshTimer();
  }, [hydrated, isAuthenticated]);

  // Keep-alive ping
  useEffect(() => {
    if (!hydrated) return;
    const { isAuthenticated: isAuth } = useAppStore.getState();
    if (!isAuth || !API_BASE) return;
=======
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
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e
    const PING_INTERVAL = 4 * 60 * 1000;
    const ping = () => {
      fetch(`${API_BASE}/health`, { method: 'GET' }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, PING_INTERVAL);
    return () => clearInterval(interval);
<<<<<<< HEAD
  }, [hydrated, isAuthenticated]);
=======
  }, [isAuthenticated]);
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e

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

<<<<<<< HEAD
  // Don't render anything until we've loaded the persisted auth state
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // After hydration, use the live store value
  const { isAuthenticated: isAuth } = useAppStore.getState();
  if (!isAuth) return null;
=======
  if (!isAuthenticated) return null;
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e

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
