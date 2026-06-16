'use client';

import { useAppStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  // Admin-only pages (not accessible by managers)
  const adminOnlyPages = ['/admin/users'];
  const isAdminOnly = adminOnlyPages.some(page => pathname.startsWith(page));
  const isAllowed = isAdminOnly
    ? user?.role === 'admin'
    : user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (!user || !isAllowed) {
      router.push('/dashboard');
    }
  }, [user, router, isAllowed]);

  if (!user || !isAllowed) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, donations, emergencies, and cats</p>
      </div>
      {children}
    </div>
  );
}
