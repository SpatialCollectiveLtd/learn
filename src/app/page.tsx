"use client";

import { useState } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Shield, Users, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

const DPW_APP_URL = process.env.NEXT_PUBLIC_DPW_APP_URL || 'https://app.spatialcollective.com';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'youth' | 'staff'>('youth');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleYouthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/youth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youthId: userId }),
      });

      const data = await response.json();

      if (data.success) {
        const payload = data.data || data;
        localStorage.setItem('token', payload.token);
        localStorage.setItem('userData', JSON.stringify(payload.user));
        localStorage.setItem('userType', 'youth');
        router.push('/dashboard');
      } else {
        setError(data.error?.message || 'Authentication failed. Please check your Youth ID.');
      }
    } catch {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      <BackgroundBeams className="opacity-40" />

      <div className="relative z-10 w-full max-w-md px-4">
        {}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-white mb-2">
            <span className="text-[#dc2626]">SC</span> Training Hub
          </h1>
          <p className="text-[#a3a3a3]">Spatial Collective Learning Platform</p>
        </div>

        {}
        <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
          {}
          <div className="grid grid-cols-2 border-b border-[#2a2a2a]">
            <button
              onClick={() => {
                setLoginType('youth');
                setUserId('');
                setError('');
              }}
              className={`py-4 px-6 font-semibold transition-all ${
                loginType === 'youth'
                  ? 'bg-[#dc2626] text-white'
                  : 'bg-transparent text-[#a3a3a3] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                <span>Youth</span>
              </div>
            </button>
            <button
              onClick={() => {
                setLoginType('staff');
                setUserId('');
                setError('');
              }}
              className={`py-4 px-6 font-semibold transition-all ${
                loginType === 'staff'
                  ? 'bg-[#dc2626] text-white'
                  : 'bg-transparent text-[#a3a3a3] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Staff</span>
              </div>
            </button>
          </div>

          {}
          <div className="p-8">
            {loginType === 'youth' ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-heading font-bold text-white mb-2">
                    Youth Login
                  </h2>
                  <p className="text-[#a3a3a3] text-sm">
                    Enter your Youth ID to access your training
                  </p>
                </div>

                <form onSubmit={handleYouthLogin} className="space-y-5">
                  <div>
                    <label
                      htmlFor="userId"
                      className="block text-sm font-medium text-[#e5e5e5] mb-2"
                    >
                      Youth ID
                    </label>
                    <input
                      type="text"
                      id="userId"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-all"
                      placeholder="e.g. KAY123"
                      required
                      autoFocus
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
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                  <p className="text-xs text-[#737373] text-center">
                    Enter the Youth ID assigned to you by your trainer.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-heading font-bold text-white mb-2">
                    Staff Access
                  </h2>
                  <p className="text-[#a3a3a3] text-sm">
                    Trainers and admins access Learn through the DPW App
                  </p>
                </div>

                <div className="bg-black/50 border border-[#2a2a2a] rounded-lg p-6 text-center">
                  <Shield className="w-12 h-12 text-[#a3a3a3] mx-auto mb-4" />
                  <p className="text-[#e5e5e5] mb-4">
                    Open Learn from the DPW App when available. Direct email sign-in is only for staff accounts that have Learn credentials enabled.
                  </p>
                  <a
                    href={DPW_APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Open DPW App
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="mt-6 pt-6 border-t border-[#2a2a2a] text-center">
                  <p className="text-xs text-[#737373] mb-3">
                    DPW launch is preferred for trainers and admins, but email sign-in is still available when configured.
                  </p>
                  <a href="/auth/staff" className="text-xs text-[#dc2626] hover:text-[#ef4444] transition-colors">
                    Or sign in with email →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {}
        <div className="text-center mt-8">
          <p className="text-[#737373] text-sm">
            © {new Date().getFullYear()} Spatial Collective. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
