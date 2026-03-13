'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Users, Home } from 'lucide-react';
import { clearStaffSession, getStaffSession, type StaffSession } from '@/lib/staff-session';

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStaffSession();
    if (!session) {
      router.replace('/');
      return;
    }

    if (session.role !== 'trainer') {
      router.replace(session.role === 'admin' ? '/admin' : '/');
      return;
    }

    setUser(session);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    clearStaffSession();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626] mx-auto mb-4" />
          <p className="text-sm text-[#a3a3a3]">Loading trainer workspace…</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/trainer', label: 'Overview', icon: Home },
    { href: '/trainer/youth', label: 'My Youth', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <nav className="bg-[#1F2121] border-b border-[#262626] px-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="min-w-0">
              <span className="text-white font-heading font-bold text-lg block">
                <span className="text-[#dc2626]">SC</span> Trainer
              </span>
              {user.settlement && (
                <p className="text-[11px] text-[#737373] md:hidden truncate">{user.settlement}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm text-white">{user.fullName}</p>
                {user.settlement && (
                  <p className="text-xs text-[#737373]">{user.settlement}</p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-[#737373] hover:text-white transition-colors text-sm"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 pb-3">
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
      </nav>

      <main className="flex-1 py-6 md:py-8 px-4 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-[#262626] md:hidden">
        <div className="flex items-stretch max-w-lg mx-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/trainer' && pathname.startsWith(href));
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 min-h-[56px] transition-colors ${
                  isActive ? 'text-[#dc2626]' : 'text-[#737373] hover:text-[#a3a3a3] active:bg-white/5'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
