"use client";

import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { CometCard } from "@/components/ui/comet-card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, LogOut, BookOpen, Map, Smartphone, Home, CheckSquare } from "lucide-react";

export default function StaffDashboard() {
  const router = useRouter();
  const [staffData, setStaffData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated as staff
    const userType = localStorage.getItem('userType');
    const staffId = sessionStorage.getItem('staffId');
    const staffName = sessionStorage.getItem('staffName');
    const staffRole = sessionStorage.getItem('staffRole');

    if (userType !== 'staff' || !staffId) {
      // Not authenticated or not a staff user
      router.push('/');
      return;
    }

    setStaffData({
      staffId,
      name: staffName,
      role: staffRole,
    });
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('userType');
    router.push('/');
  };

  const modules = [
    {
      title: "Digitization",
      description: "Learn digital mapping, satellite image interpretation, and JOSM workflows.",
      link: "/digitization",
      icon: <Map className="w-12 h-12" />,
      code: "DIG1",
      available: true,
    },
    {
      title: "Mobile Mapping",
      description: "Master field data collection using mobile devices.",
      link: "/mobile-mapping",
      icon: <Smartphone className="w-12 h-12" />,
      code: "MOB2",
      available: true,
    },
    {
      title: "Household Survey",
      description: "Conduct comprehensive household surveys.",
      link: "/household-survey",
      icon: <Home className="w-12 h-12" />,
      code: "HSV3",
      available: true,
    },
    {
      title: "Microtasking",
      description: "Complete and validate mapping tasks efficiently.",
      link: "/microtasking",
      icon: <CheckSquare className="w-12 h-12" />,
      code: "MCR4",
      available: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]"></div>
          <p className="mt-4 text-[#e5e5e5]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-[#1F2121]/80 backdrop-blur-sm border-b border-[#2a2a2a] sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-[#dc2626] text-2xl font-bold">SC</div>
                <div>
                  <h1 className="text-lg font-heading font-bold text-white">
                    Staff Portal
                  </h1>
                  <p className="text-xs text-[#a3a3a3]">Full Access - All Modules</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-[#e5e5e5] hover:text-white transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-2xl shadow-lg p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-[#dc2626]/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[#dc2626]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-heading font-bold text-white mb-2">
                    Welcome, {staffData?.name || 'Staff Member'}!
                  </h2>
                  <p className="text-[#a3a3a3] mb-4">
                    Staff ID: <span className="font-mono font-semibold text-[#e5e5e5]">{staffData?.staffId}</span>
                    {staffData?.role && (
                      <span className="ml-4">
                        Role: <span className="capitalize font-semibold text-[#e5e5e5]">{staffData.role}</span>
                      </span>
                    )}
                  </p>
                  <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-[#dc2626] flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold text-sm">Full Access Granted</p>
                        <p className="text-[#e5e5e5] text-xs">
                          As a staff member, you have unrestricted access to all training modules including validator training and administrative resources.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Training Modules */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-heading font-bold text-white mb-6">
              All Training Modules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((module, index) => (
                <CometCard key={index} rotateDepth={10} translateDepth={15}>
                  <Link href={module.link}>
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 hover:border-[#dc2626]/50 transition-all h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-[#dc2626]">{module.icon}</div>
                        <span className="text-xs font-mono text-[#737373]">#{module.code}</span>
                      </div>

                      <h4 className="text-lg font-heading font-bold text-white mb-2">
                        {module.title}
                      </h4>

                      <p className="text-sm text-[#a3a3a3] mb-4">
                        {module.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[#dc2626] text-sm font-semibold">
                          Access Training →
                        </span>
                      </div>
                    </div>
                  </Link>
                </CometCard>
              ))}
            </div>
          </div>

          {/* Admin Resources */}
          <div className="max-w-5xl mx-auto mt-12">
            <h3 className="text-xl font-heading font-bold text-white mb-6">
              Staff Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-xl p-6">
                <h4 className="text-white font-semibold mb-2">Youth Progress Tracking</h4>
                <p className="text-[#a3a3a3] text-sm mb-3">
                  Monitor youth participant progress and training completion.
                </p>
                <button className="text-[#737373] text-sm hover:text-[#a3a3a3]">
                  Coming Soon
                </button>
              </div>

              <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-xl p-6">
                <h4 className="text-white font-semibold mb-2">Training Reports</h4>
                <p className="text-[#a3a3a3] text-sm mb-3">
                  Generate comprehensive training reports and analytics.
                </p>
                <button className="text-[#737373] text-sm hover:text-[#a3a3a3]">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#2a2a2a] mt-12 bg-black/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-[#737373]">
              © {new Date().getFullYear()} Spatial Collective. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
