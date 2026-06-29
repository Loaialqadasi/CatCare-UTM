'use client';

import { useAppStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const ROLE_RANK: Record<string, number> = {
  student: 0,
  volunteer: 1,
  manager: 2,
  admin: 3,
};

// Admin-only pages — only admin role can access
const adminOnlyPages = ['/admin/users', '/admin/donations'];
// Manager+ pages — manager and admin can access
const managerPlusPages = ['/admin/cats', '/admin/emergencies', '/admin/volunteers'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const isAdminOnly = adminOnlyPages.some(page => pathname.startsWith(page));
  const isManagerPlus = managerPlusPages.some(page => pathname.startsWith(page));
  const userRank = ROLE_RANK[user?.role ?? 'student'] ?? 0;

  useEffect(() => {
    if (!user) {
      router.push('/dashboard');
      return;
    }
    if (isAdminOnly && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (isManagerPlus && userRank < ROLE_RANK['manager']) {
      router.push('/dashboard');
      return;
    }
    // For the /admin root page, require at least manager
    if (pathname === '/admin' && userRank < ROLE_RANK['manager']) {
      router.push('/dashboard');
      return;
    }
  }, [user, router, isAdminOnly, isManagerPlus, userRank, pathname]);

  if (!user) return null;
  if (isAdminOnly && user.role !== 'admin') return null;
  if (isManagerPlus && userRank < ROLE_RANK['manager']) return null;
  if (pathname === '/admin' && userRank < ROLE_RANK['manager']) return null;

  const panelTitle = user.role === 'admin' ? 'Admin Panel' : 'Manager Panel';
  const panelDesc = user.role === 'admin'
    ? 'Manage users, donations, emergencies, and cats'
    : 'Manage emergencies, volunteers, and cats';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{panelTitle}</h1>
        <p className="text-muted-foreground">{panelDesc}</p>
      </div>
      {children}
    </div>
  );
}
