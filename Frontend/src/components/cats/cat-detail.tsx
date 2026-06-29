'use client';

// Loai Rafaat — CCU-S1-02 | Cat Management Module

import { useEffect, useState, useRef } from 'react';
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
import {
  ArrowLeft,
  MapPin,
  Calendar,
  HeartPulse,
  Shield,
  AlertTriangle,
  Activity,
  Loader2,
  ImagePlus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCatById, fetchCareHistory, createCareHistory, updateCatHealthStatus } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Cat, HealthStatus, OwnershipTag, CareHistoryEntry, CareType } from '@/lib/types';


const healthConfig: Record<HealthStatus, { color: string; bgColor: string; label: string; icon: string }> = {
  healthy: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    label: 'Healthy',
    icon: '💚',
  },
  needs_attention: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    label: 'Needs Attention',
    icon: '💛',
  },
  injured: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-800',
    label: 'Injured',
    icon: '❤️‍🩹',
  },
  unknown: {
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-950/40 border-gray-200 dark:border-gray-800',
    label: 'Unknown',
    icon: '❓',
  },
};

const ownershipLabels: Record<OwnershipTag, string> = {
  stray: 'Stray',
  adopted: 'Adopted',
  campus_managed: 'Campus Managed',
  unknown: 'Unknown',
};

const ownershipColors: Record<OwnershipTag, string> = {
  stray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  adopted: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  campus_managed: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  unknown: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CatDetailProps {
  catId: string;
}

export function CatDetail({ catId }: CatDetailProps) {
  const [cat, setCat] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAppStore();

  const ROLE_RANK: Record<string, number> = { student: 0, volunteer: 1, manager: 2, admin: 3 };
  const userRank = ROLE_RANK[user?.role ?? 'student'] ?? 0;
  const isVolunteerPlus = userRank >= 1;

  useEffect(() => {
    if (!catId) return;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchCatById(catId);
        setCat(data);
      } catch {
        setCat(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [catId]);

  // FIX: Volunteer can update health status inline
  const [updatingHealth, setUpdatingHealth] = useState(false);
  const handleHealthStatusChange = async (newStatus: HealthStatus) => {
    if (!cat) return;
    setUpdatingHealth(true);
    try {
      const updated = await updateCatHealthStatus(cat.id, newStatus);
      setCat(updated);
      toast.success('Health status updated', { description: `${cat.nickname} is now ${healthConfig[newStatus].label}` });
    } catch (err) {
      toast.error('Failed to update health status', { description: err instanceof Error ? err.message : 'Please try again' });
    } finally {
      setUpdatingHealth(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (!cat) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Cat not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/cats')}>Go Back</Button>
      </div>
    );
  }

  const health = healthConfig[cat.healthStatus] ?? healthConfig.unknown;

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => router.push('/cats')} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card className="rounded-xl overflow-hidden border-border/50">
            <div className="aspect-square relative bg-muted">
              <Image
                src={cat.photoUrl || 'https://placecats.com/millie/400/300'}
                alt={cat.nickname}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                onError={(e) => { const target = e.target as HTMLImageElement; target.src = 'https://placecats.com/millie/400/300'; }}
              />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{cat.nickname}</h1>
              <Badge variant="outline" className={cn('text-sm px-3 py-0.5 font-medium border', health.bgColor, health.color)}>
                {health.icon} {health.label}
              </Badge>
              <Badge variant="secondary" className={cn('text-sm px-3 py-0.5', ownershipColors[cat.ownershipTag] ?? ownershipColors.unknown)}>
                {ownershipLabels[cat.ownershipTag] ?? 'Unknown'}
              </Badge>
            </div>
          </div>

          {/* FIX: Volunteer health status update */}
          {isVolunteerPlus && (
            <Card className="rounded-xl border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Update Health Status</span>
                  <Select value={cat.healthStatus} onValueChange={(v) => handleHealthStatusChange(v as HealthStatus)} disabled={updatingHealth}>
                    <SelectTrigger className="w-[180px] h-8 text-sm">
                      {updatingHealth ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="needs_attention">Needs Attention</SelectItem>
                      <SelectItem value="injured">Injured</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-foreground leading-relaxed">{cat.description || 'No description available.'}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-xl border-border/50"><CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span className="text-xs font-medium">Location</span></div>
              <p className="text-sm font-semibold text-foreground">{cat.locationName}</p>
            </CardContent></Card>
            <Card className="rounded-xl border-border/50"><CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground"><HeartPulse className="h-4 w-4" /><span className="text-xs font-medium">Health</span></div>
              <p className="text-sm font-semibold text-foreground">{health.label}</p>
            </CardContent></Card>
            <Card className="rounded-xl border-border/50"><CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground"><Shield className="h-4 w-4" /><span className="text-xs font-medium">Ownership</span></div>
              <p className="text-sm font-semibold text-foreground">{ownershipLabels[cat.ownershipTag] ?? 'Unknown'}</p>
            </CardContent></Card>
            <Card className="rounded-xl border-border/50"><CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span className="text-xs font-medium">Registered</span></div>
              <p className="text-sm font-semibold text-foreground">{new Date(cat.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </CardContent></Card>
          </div>

          <Button onClick={() => { router.push(`/emergencies/new?catId=${cat.id}`); }} className="w-full">
            <AlertTriangle className="mr-2 h-4 w-4" /> Report Emergency for {cat.nickname}
          </Button>
        </div>
      </div>

      <CareHistorySection catId={cat.id} isVolunteerPlus={isVolunteerPlus} onCareAdded={() => { /* trigger reload */ }} />
    </div>
  );
}

const careTypeConfig: Record<CareType, { icon: string; label: string; color: string; bgColor: string }> = {
  feeding: { icon: '🍖', label: 'Feeding', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40' },
  medical: { icon: '💊', label: 'Medical', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-950/40' },
  grooming: { icon: '✂️', label: 'Grooming', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-950/40' },
  shelter: { icon: '🏠', label: 'Shelter', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40' },
  rescue: { icon: '🚨', label: 'Rescue', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-950/40' },
  other: { icon: '📋', label: 'Other', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-950/40' },
};

function CareHistorySection({ catId, isVolunteerPlus, onCareAdded }: { catId: string; isVolunteerPlus: boolean; onCareAdded: () => void }) {
  const [careHistory, setCareHistory] = useState<CareHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // FIX: Care history recording form for volunteers
  const [showForm, setShowForm] = useState(false);
  const [careType, setCareType] = useState<CareType>('feeding');
  const [careDescription, setCareDescription] = useState('');
  const [carePhoto, setCarePhoto] = useState<File | null>(null);
  const [carePhotoPreview, setCarePhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const careFileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchCareHistory(catId);
      setCareHistory(data);
    } catch {
      setCareHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [catId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 5 MB.');
      return;
    }
    setCarePhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setCarePhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitCare = async () => {
    if (!careDescription.trim() || careDescription.trim().length < 3) {
      toast.error('Description must be at least 3 characters');
      return;
    }
    setSubmitting(true);
    try {
      await createCareHistory(catId, {
        careType,
        description: careDescription.trim(),
        photo: carePhoto || undefined,
      });
      toast.success('Care recorded', { description: `${careTypeConfig[careType].label} activity has been logged` });
      setCareDescription('');
      setCareType('feeding');
      setCarePhoto(null);
      setCarePhotoPreview(null);
      setShowForm(false);
      if (careFileInputRef.current) careFileInputRef.current.value = '';
      await loadHistory();
      onCareAdded();
    } catch (err) {
      toast.error('Failed to record care', { description: err instanceof Error ? err.message : 'Please try again' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-xl border-border/50">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Care History</h2>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Care History</h2>
          {/* FIX: Record Care button for volunteers */}
          {isVolunteerPlus && !showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="bg-violet-500 hover:bg-violet-600 text-white">
              <Activity className="mr-1.5 h-3.5 w-3.5" /> Record Care
            </Button>
          )}
        </div>

        {/* FIX: Care history recording form */}
        {showForm && (
          <Card className="rounded-xl border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Record Care Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Care Type</label>
                <Select value={careType} onValueChange={(v) => setCareType(v as CareType)}>
                  <SelectTrigger className="w-full h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feeding">🍖 Feeding</SelectItem>
                    <SelectItem value="medical">💊 Medical</SelectItem>
                    <SelectItem value="grooming">✂️ Grooming</SelectItem>
                    <SelectItem value="shelter">🏠 Shelter</SelectItem>
                    <SelectItem value="rescue">🚨 Rescue</SelectItem>
                    <SelectItem value="other">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  value={careDescription}
                  onChange={(e) => setCareDescription(e.target.value)}
                  placeholder="Describe the care activity..."
                  className="w-full min-h-[60px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-violet-500"
                  minLength={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Photo (optional)</label>
                <input ref={careFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" disabled={submitting} />
                {carePhotoPreview ? (
                  <div className="relative inline-block">
                    <img src={carePhotoPreview} alt="Care photo preview" className="h-20 w-20 rounded-lg object-cover border border-border" />
                    <button type="button" onClick={() => { setCarePhoto(null); setCarePhotoPreview(null); if (careFileInputRef.current) careFileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90" disabled={submitting}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => careFileInputRef.current?.click()} className="flex items-center gap-2 h-16 w-full rounded-lg border-2 border-dashed border-border hover:border-violet-500/50 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors" disabled={submitting}>
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload photo</span>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmitCare} disabled={submitting || careDescription.trim().length < 3} className="bg-violet-500 hover:bg-violet-600 text-white">
                  {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-1.5 h-3.5 w-3.5" />}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setCareDescription(''); setCarePhoto(null); setCarePhotoPreview(null); }} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {careHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No care history recorded yet.</p>
        ) : (
          <div className="space-y-0">
            {careHistory.map((entry, i) => {
              const config = careTypeConfig[entry.careType] ?? careTypeConfig.other;
              return (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0', config.bgColor)}>
                      {config.icon}
                    </div>
                    {i < careHistory.length - 1 && (
                      <div className="w-0.5 flex-1 min-h-[24px] bg-gray-200 dark:bg-gray-700" />
                    )}
                  </div>
                  <div className="pb-5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-5', config.bgColor, config.color)}>
                        {config.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">by {entry.performedBy}</p>
                    {/* FIX: Show care photo if exists */}
                    {entry.photoUrl && (
                      <a href={entry.photoUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-1.5">
                        <img src={entry.photoUrl} alt="Care photo" className="h-16 w-16 rounded-lg object-cover border border-border hover:opacity-80 transition-opacity" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}