'use client';

import { useAppStore } from '@/lib/store';
<<<<<<< HEAD
import { useRouter, usePathname } from 'next/navigation';
=======
import { useRouter } from 'next/navigation';
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  const router = useRouter();
<<<<<<< HEAD
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
=======

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, router, isAdmin]);

  if (!user || !isAdmin) return null;
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e

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
