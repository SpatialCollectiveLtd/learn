'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Users, Home } from 'lucide-react';

interface TrainerUser {
  userId: string;
  fullName: string;
  role: string;
  settlement: string | null;
}

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<TrainerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
      router.replace('/');
      return;
    }

    try {
      const parsed = JSON.parse(userData);
      if (parsed.role !== 'trainer') {
        router.replace(parsed.role === 'admin' ? '/admin' : '/');
        return;
      }
      setUser(parsed);
    } catch {
      router.replace('/');
      return;
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]" />
      </div>
    );
  }

  const navLinks = [
    { href: '/trainer', label: 'Overview', icon: Home },
    { href: '/trainer/youth', label: 'My Youth', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Top nav */}
      <nav className="bg-[#1F2121] border-b border-[#262626] px-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="text-white font-heading font-bold text-lg">
              <span className="text-[#dc2626]">SC</span> Trainer
            </span>
            <div className="flex items-center gap-1">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href || (href !== '/trainer' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-[#dc2626] text-white' : 'text-[#a3a3a3] hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white">{user.fullName}</p>
              {user.settlement && (
                <p className="text-xs text-[#737373]">{user.settlement}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[#737373] hover:text-white transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
