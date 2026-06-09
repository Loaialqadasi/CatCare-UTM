'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Cat, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCats } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Cat as CatType, HealthStatus, CatFilters } from '@/lib/types';

const healthConfig: Record<HealthStatus, { color: string; bgColor: string; label: string }> = {
  healthy: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', label: 'Healthy' },
  needs_attention: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40', label: 'Needs Attention' },
  injured: { color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-950/40', label: 'Injured' },
  unknown: { color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-950/40', label: 'Unknown' },
};

const ownershipLabels: Record<string, string> = {
  stray: 'Stray',
  adopted: 'Adopted',
  campus_managed: 'Campus Cat',
  unknown: 'Unknown',
};

export default function AdminCatsPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [cats, setCats] = useState<CatType[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthFilter, setHealthFilter] = useState<HealthStatus | ''>('');

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const loadData = useCallback(async () => {
    try {
      const filters: CatFilters = {
        pageSize: 100,
        healthStatus: healthFilter || undefined,
      };
      const res = await fetchCats(filters);
      setCats(res.items);
    } catch {
      toast.error('Failed to load cats');
    } finally {
      setLoading(false);
    }
  }, [healthFilter]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadData();
    }
  }, [loadData, user]);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Cat Management</h2>
        <Select value={healthFilter} onValueChange={(v) => { setHealthFilter(v === 'all' ? '' : (v as HealthStatus)); setLoading(true); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="needs_attention">Needs Attention</SelectItem>
            <SelectItem value="injured">Injured</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : cats.length === 0 ? (
        <Card className="rounded-xl border-border/50">
          <CardContent className="py-16 text-center">
            <Cat className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No cats found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cats.map((cat) => {
            const health = healthConfig[cat.healthStatus] ?? healthConfig.unknown;
            return (
              <Card
                key={cat.id}
                className="rounded-xl border-border/50 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => router.push(`/cats/${cat.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-muted">
                      <img
                        src={cat.photoUrl || 'https://placecats.com/millie/400/300'}
                        alt={cat.nickname}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placecats.com/millie/400/300';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{cat.nickname}</span>
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-5', health.bgColor, health.color)}>
                          {health.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {ownershipLabels[cat.ownershipTag]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{cat.description || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{cat.locationName}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(cat.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
