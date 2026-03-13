'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { saveStaffSession } from '@/lib/staff-session';

function LaunchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No launch token provided. Please use the "Launch Learn" button from the DPW App.');
      return;
    }

    async function verifyAndRedirect(launchToken: string) {
      try {
        const res = await fetch('/api/auth/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: launchToken }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || 'Launch token is invalid or expired. Please try again from the DPW App.');
          return;
        }

        // Store auth data
        saveStaffSession(data.data.token, data.data.user);

        // Redirect based on role
        const role = data.data.user?.role;
        router.replace(role === 'admin' ? '/admin' : role === 'trainer' ? '/trainer' : '/dashboard');
      } catch {
        setError('Failed to connect. Please check your internet connection and try again.');
      }
    }

    verifyAndRedirect(token);
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="max-w-md w-full bg-[#1F2121] rounded-2xl border border-[#dc2626]/30 p-8 text-center">
          <div className="bg-[#dc2626]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#dc2626]/30">
            <span className="text-[#dc2626] text-2xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-heading font-bold text-white mb-3">Launch Failed</h1>
          <p className="text-[#a3a3a3] mb-6">{error}</p>
          <a
            href={process.env.NEXT_PUBLIC_DPW_APP_URL || 'https://app.spatialcollective.com'}
            className="inline-block px-6 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold rounded-lg transition-colors"
          >
            Go to DPW App
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626] mx-auto mb-4" />
        <p className="text-[#a3a3a3]">Signing you in…</p>
      </div>
    </div>
  );
}

export default function LaunchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]" />
        </div>
      }
    >
      <LaunchContent />
    </Suspense>
  );
}
