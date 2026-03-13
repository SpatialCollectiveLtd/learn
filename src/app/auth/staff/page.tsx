'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowLeft, ExternalLink } from 'lucide-react';
import { saveStaffSession } from '@/lib/staff-session';

const DPW_APP_URL = process.env.NEXT_PUBLIC_DPW_APP_URL || 'https://app.spatialcollective.com';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (data.success) {
        saveStaffSession(data.data.token, data.data.user);
        const role = data.data.user?.role;
        router.replace(role === 'admin' ? '/admin' : '/trainer');
      } else {
        setError(data.error?.message || 'Invalid email or password.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-[#dc2626]">SC</span> Training Hub
          </h1>
          <p className="text-[#a3a3a3] text-sm">Trainer and admin access</p>
        </div>

        <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#dc2626]/20 p-2 rounded-lg border border-[#dc2626]/30">
              <Shield className="w-5 h-5 text-[#dc2626]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Staff Login</h2>
              <p className="text-xs text-[#737373]">Use Learn credentials if your account has email access enabled</p>
            </div>
          </div>

          <div className="bg-black/40 border border-[#2a2a2a] rounded-xl p-4 mb-6">
            <p className="text-sm text-[#e5e5e5] mb-2">Preferred path</p>
            <p className="text-xs text-[#737373] leading-relaxed mb-3">
              Trainers usually open Learn from the DPW App. Direct email sign-in remains available as a fallback.
            </p>
            <a
              href={DPW_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#dc2626] hover:text-[#ef4444] transition-colors"
            >
              Open DPW App
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#e5e5e5] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-all"
                placeholder="trainer@example.com"
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#e5e5e5] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-all"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg">
                <p className="text-sm text-[#dc2626]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>

            <p className="text-xs text-[#737373] text-center leading-relaxed">
              After sign-in you will be sent to your trainer or admin dashboard automatically.
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-sm text-[#a3a3a3] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to main login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
