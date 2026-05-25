'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Check, Clock, AlertCircle, XCircle, Eye, ShieldCheck, Heart, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchDonations, fetchDonationSummary, approveDonation, rejectDonation, reviewDonation } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import type { Donation, DonationStatus, DonationSummary } from '@/lib/types';

import { toast } from 'sonner';

const statusConfig: Record<DonationStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', icon: <Clock className="h-3.5 w-3.5" /> },
  reviewed: { label: 'Reviewed', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  approved: { label: 'Approved', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', icon: <Check className="h-3.5 w-3.5" /> },
  rejected: { label: 'Rejected', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800', icon: <XCircle className="h-3.5 w-3.5" /> },
};

function SummaryCard({ title, value, icon, color, bgColor }: { title: string; value: number | string; icon: React.ReactNode; color: string; bgColor: string }) {
  return (
    <Card className="rounded-xl border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', bgColor)}>
            <span className={cn('text-lg', color)}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDonationDashboard() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DonationStatus | ''>('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectDonationId, setRejectDonationId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAppStore();

  const isAdmin = user?.role === 'admin';

  const loadData = useCallback(async () => {
    try {
      const [donationsRes, summaryRes] = await Promise.all([
        fetchDonations({ status: statusFilter || undefined, pageSize: 100 }),
        fetchDonationSummary(),
      ]);
      setDonations(donationsRes.items);
      setSummary(summaryRes);
    } catch {
      toast.error('Failed to load donation data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveDonation(id);
      toast.success('Donation approved');
      await loadData();
    } catch (err: any) { toast.error(err.message || 'Failed to approve'); }
    finally { setActionLoading(null); }
  };

  const handleReview = async (id: string) => {
    setActionLoading(id);
    try {
      await reviewDonation(id);
      toast.success('Donation marked as reviewed');
      await loadData();
    } catch (err: any) { toast.error(err.message || 'Failed to review'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectDonationId) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 3) {
      toast.error('Please provide a rejection reason (min 3 characters)');
      return;
    }
    setActionLoading(rejectDonationId);
    try {
      await rejectDonation(rejectDonationId, rejectionReason.trim());
      toast.success('Donation rejected');
      setRejectDialogOpen(false);
      setRejectDonationId(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) { toast.error(err.message || 'Failed to reject'); }
    finally { setActionLoading(null); }
  };

  const openRejectDialog = (id: string) => {
    setRejectDonationId(id);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  if (!isAdmin) {
    return (
      <Card className="rounded-xl border-border/50">
        <CardContent className="py-16 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Admin Access Required</p>
          <p className="text-sm text-muted-foreground mt-1">Only administrators can review donations</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-60 w-full" /></div>;

  const filterTabs: { value: DonationStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">Donation Review Dashboard</h2>

      {/* Summary Cards - UC04-TC001 */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Donations" value={summary.total} icon={<Heart className="h-5 w-5" />} color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-100 dark:bg-blue-950/40" />
          <SummaryCard title="Pending" value={summary.pending} icon={<Clock className="h-5 w-5" />} color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-100 dark:bg-amber-950/40" />
          <SummaryCard title="Approved" value={summary.approved} icon={<Check className="h-5 w-5" />} color="text-emerald-600 dark:text-emerald-400" bgColor="bg-emerald-100 dark:bg-emerald-950/40" />
          <SummaryCard title="Total Approved (RM)" value={summary.approvedAmount.toLocaleString('en-MY', { minimumFractionDigits: 0 })} icon={<DollarSign className="h-5 w-5" />} color="text-green-600 dark:text-green-400" bgColor="bg-green-100 dark:bg-green-950/40" />
        </div>
      )}

      {/* Status Filter Tabs - UC04-TC002 */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(tab.value); setLoading(true); }}
            className={cn(statusFilter === tab.value && 'bg-amber-500 hover:bg-amber-600 text-white')}
          >
            {tab.label}
            {tab.value === 'pending' && summary && summary.pending > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">{summary.pending}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Donation List */}
      {donations.length === 0 ? (
        <Card className="rounded-xl border-border/50">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No donations found for this filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {donations.map((donation) => {
            const cfg = statusConfig[donation.status] ?? statusConfig.pending;
            const isPending = donation.status === 'pending';
            const isReviewed = donation.status === 'reviewed';
            const canAct = isPending || isReviewed;

            return (
              <Card key={donation.id} className="rounded-xl border-border/50 hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">RM {donation.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
                        <Badge variant="outline" className={cn('text-xs px-2 py-0.5 font-medium border', cfg.bgColor, cfg.color)}>
                          {cfg.icon}<span className="ml-1">{cfg.label}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{donation.donorName} ({donation.donorEmail})</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(donation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      {donation.note && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{donation.note}</p>}
                      {donation.rejectionReason && <p className="text-sm text-red-600 dark:text-red-400 mt-1 line-clamp-1">Rejection: {donation.rejectionReason}</p>}
                    </div>

                    {canAct && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isPending && (
                          <Button size="sm" variant="outline" onClick={() => handleReview(donation.id)} disabled={actionLoading === donation.id} className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/40">
                            <Eye className="mr-1 h-3.5 w-3.5" />Review
                          </Button>
                        )}
                        <Button size="sm" onClick={() => handleApprove(donation.id)} disabled={actionLoading === donation.id} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                          <Check className="mr-1 h-3.5 w-3.5" />Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openRejectDialog(donation.id)} disabled={actionLoading === donation.id} className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/40">
                          <XCircle className="mr-1 h-3.5 w-3.5" />Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rejection Dialog - UC03-TC002 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Donation</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this donation. The donor will be able to see this reason.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="rejectionReason">Rejection Reason *</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejecting this donation..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{rejectionReason.length}/500 characters (minimum 3)</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReject} disabled={rejectionReason.trim().length < 3} className="bg-red-500 hover:bg-red-600 text-white">Reject Donation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
