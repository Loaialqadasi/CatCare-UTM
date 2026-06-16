'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Cat, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://catcare-backend.onrender.com/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to send reset email');
      }
      setSent(true);
      toast.success('Reset email sent', { description: 'Check your inbox for a password reset link' });
    } catch (err) {
      toast.error('Failed to send reset email', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-500/30 mb-4">
            <Cat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">CatCare UTM</h1>
          <p className="text-muted-foreground mt-1">Reset your password</p>
        </div>

        <Card className="rounded-2xl shadow-xl border-amber-100/80 backdrop-blur-sm bg-white/80">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Forgot Password</CardTitle>
            <CardDescription>
              {sent
                ? 'A reset link has been sent to your email'
                : 'Enter your UTM email to receive a reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  If an account with <strong>{email}</strong> exists, you will receive a password reset link shortly.
                </p>
                <Button
                  onClick={() => router.push('/login')}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@utm.my"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending reset link...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
