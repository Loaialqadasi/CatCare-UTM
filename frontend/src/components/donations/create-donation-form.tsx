'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, ArrowLeft } from 'lucide-react';
import { createDonation } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';


export function CreateDonationForm() {
  const { setCurrentView, goBack, user } = useAppStore();
  const [donorName, setDonorName] = useState(user?.fullName || '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateForm = (): string | null => {
    if (!donorName.trim()) return 'Please enter your name';
    if (donorName.trim().length < 2) return 'Name must be at least 2 characters';
    if (!donorEmail.trim()) return 'Please enter your email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) return 'Please enter a valid email';
    if (!amount || Number(amount) <= 0) return 'Please enter a valid donation amount';
    if (Number(amount) > 1000000) return 'Amount cannot exceed RM 1,000,000';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      await createDonation(
        {
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          amount: Number(amount),
          note: note.trim() || undefined,
        }
      );
      toast.success('Donation submitted successfully!');
      goBack();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit donation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go Back
      </Button>

      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-amber-500" />
            Make a Donation
          </CardTitle>
          <p className="text-sm text-muted-foreground">Your contribution helps care for campus cats at UTM.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donorName">Full Name *</Label>
                <Input id="donorName" value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="donorEmail">Email *</Label>
                <Input id="donorEmail" type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="your.name@utm.my" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Donation Amount (RM) *</Label>
              <Input id="amount" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any message or note about your donation..." maxLength={500} rows={3} />
              <p className="text-xs text-muted-foreground">{note.length}/500 characters</p>
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
              {submitting ? 'Submitting...' : 'Submit Donation'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
