'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Users, Home } from 'lucide-react';

interface AdminUser {
  userId: string;
  fullName: string;
  role: string;
  settlement: string | null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
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
      if (parsed.role !== 'admin') {
        router.replace(parsed.role === 'trainer' ? '/trainer' : '/');
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
    { href: '/admin', label: 'Overview', icon: Home },
    { href: '/admin/youth', label: 'Youth', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Top nav */}
      <nav className="bg-[#1F2121] border-b border-[#262626] px-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="text-white font-heading font-bold text-lg">
              <span className="text-[#dc2626]">SC</span> Admin
            </span>
            <div className="flex items-center gap-1">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
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
            <span className="text-sm text-[#a3a3a3] hidden sm:block">{user.fullName}</span>
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
