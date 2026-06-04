'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HandHeart, Users, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchAllVolunteers, updateVolunteerStatus } from '@/lib/api-client';
import type { Volunteer, VolunteerStatus } from '@/lib/types';

const statusColors: Record<VolunteerStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

export default function AdminVolunteersPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    async function loadVolunteers() {
      try {
        const res = await fetchAllVolunteers();
        setVolunteers(res.items);
      } catch {
        toast.error('Failed to load volunteers');
      } finally {
        setLoading(false);
      }
    }

    loadVolunteers();
  }, [user, router]);

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingId(id);
    try {
      await updateVolunteerStatus(id, newStatus);
      setVolunteers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
      );
      toast.success(`Volunteer ${newStatus}`, {
        description: `Application has been ${newStatus}`,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (user?.role !== 'admin') return null;

  const stats = {
    total: volunteers.length,
    pending: volunteers.filter((v) => v.status === 'pending').length,
    approved: volunteers.filter((v) => v.status === 'approved').length,
    rejected: volunteers.filter((v) => v.status === 'rejected').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">Volunteer Management</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/40">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40">
              <HandHeart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-foreground">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-xl font-bold text-foreground">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="text-xl font-bold text-foreground">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volunteers Table */}
      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-base">All Volunteer Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : volunteers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No volunteer applications yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volunteers.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">{v.studentId}</TableCell>
                      <TableCell className="text-muted-foreground">{v.faculty}</TableCell>
                      <TableCell>{v.age}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-xs', statusColors[v.status])}>
                          {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleStatusChange(v.id, 'approved')}
                              disabled={updatingId === v.id}
                            >
                              {updatingId === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleStatusChange(v.id, 'rejected')}
                              disabled={updatingId === v.id}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{v.status === 'approved' ? 'Accepted' : 'Declined'}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
