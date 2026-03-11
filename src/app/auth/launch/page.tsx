'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

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
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        localStorage.setItem('userType', 'staff');

        // Redirect based on role
        router.replace('/dashboard');
      } catch {
        setError('Failed to connect. Please check your internet connection and try again.');
      }
    }

    verifyAndRedirect(token);
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-xl border border-red-500/30 p-8 text-center">
          <div className="text-red-400 text-4xl mb-4">!</div>
          <h1 className="text-xl font-semibold text-white mb-3">Launch Failed</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <a
            href={process.env.NEXT_PUBLIC_DPW_APP_URL || 'https://app.spatialcollective.com'}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to DPW App
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-400">Signing you in...</p>
      </div>
    </div>
  );
}

export default function LaunchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
        </div>
      }
    >
      <LaunchContent />
    </Suspense>
  );
}
