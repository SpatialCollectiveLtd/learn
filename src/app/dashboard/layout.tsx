'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Wallet, Calendar, Mail } from 'lucide-react';

const NAV_TABS = [
  { href: '/dashboard', label: 'Home', icon: Home, exact: true },
  { href: '/dashboard/training', label: 'Training', icon: BookOpen, exact: false },
  { href: '/dashboard/payments', label: 'Pay', icon: Wallet, exact: false },
  { href: '/dashboard/days', label: 'Days', icon: Calendar, exact: false },
  { href: '/dashboard/messages', label: 'Inbox', icon: Mail, exact: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(tab: (typeof NAV_TABS)[number]) {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Page content — padded bottom so it doesn't hide behind the nav */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-[#262626] safe-area-bottom">
        <div className="flex items-stretch max-w-lg mx-auto">
          {NAV_TABS.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 transition-colors min-h-[56px] ${
                  active
                    ? 'text-[#dc2626]'
                    : 'text-[#737373] hover:text-[#a3a3a3] active:bg-white/5'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${active ? 'scale-110' : 'scale-100'}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
