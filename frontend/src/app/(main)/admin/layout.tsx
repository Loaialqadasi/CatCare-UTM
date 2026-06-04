'use client';

import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

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
