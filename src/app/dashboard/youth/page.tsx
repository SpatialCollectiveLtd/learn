"use client";

import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { CometCard } from "@/components/ui/comet-card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, CheckCircle2, FileText, Map, Smartphone, Home, CheckSquare, Lock } from "lucide-react";

export default function YouthDashboard() {
  const router = useRouter();
  const [youthData, setYouthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated as youth
    const userType = localStorage.getItem('userType');
    const storedYouthData = localStorage.getItem('youthData');
    const agreementAccepted = localStorage.getItem(`agreement-accepted-${JSON.parse(storedYouthData || '{}').youthId}`);

    if (userType !== 'youth' || !storedYouthData) {
      // Not authenticated or not a youth user
      router.push('/');
      return;
    }

    if (!agreementAccepted) {
      // Contract not signed - redirect to contract page
      router.push('/contract');
      return;
    }

    try {
      const parsed = JSON.parse(storedYouthData);
      setYouthData(parsed);
    } catch (error) {
      console.error('Failed to parse youth data:', error);
      router.push('/');
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('youthToken');
    localStorage.removeItem('youthData');
    localStorage.removeItem('userType');
    router.push('/');
  };

  const allModules = [
    {
      title: "Digitization - Mapper Training",
      description: "Learn digital mapping, JOSM, and HOT Tasking Manager workflows.",
      link: "/digitization/mapper",
      icon: <Map className="w-12 h-12" />,
      code: "DIG1-M",
      available: true,
      restricted: false,
      programType: "digitization",
    },
    {
      title: "Digitization - Validator Training",
      description: "Quality assurance and validation workflows. (Staff Only)",
      link: "#",
      icon: <Lock className="w-12 h-12" />,
      code: "DIG1-V",
      available: false,
      restricted: true,
      programType: "digitization",
    },
    {
      title: "Mobile Mapping",
      description: "Master field data collection using mobile devices.",
      link: "/mobile-mapping",
      icon: <Smartphone className="w-12 h-12" />,
      code: "MOB2",
      available: true,
      restricted: false,
      programType: "mobile_mapping",
    },
    {
      title: "Household Survey",
      description: "Conduct comprehensive household surveys.",
      link: "/household-survey",
      icon: <Home className="w-12 h-12" />,
      code: "HSV3",
      available: true,
      restricted: false,
      programType: "household_survey",
    },
    {
      title: "Microtasking",
      description: "Complete and validate mapping tasks efficiently.",
      link: "/microtasking",
      icon: <CheckSquare className="w-12 h-12" />,
      code: "MCR4",
      available: true,
      restricted: false,
      programType: "microtasking",
    },
  ];

  // Filter modules based on user's program type
  const modules = allModules.filter(module => 
    module.programType === youthData?.programType
  );

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
                    Youth Training Portal
                  </h1>
                  <p className="text-xs text-[#a3a3a3]">Your Learning Dashboard</p>
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
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#dc2626]/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-[#dc2626]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-heading font-bold text-white mb-2">
                    Welcome, {youthData?.fullName}!
                  </h2>
                  <p className="text-[#a3a3a3]">
                    Youth ID: <span className="font-mono font-semibold text-[#e5e5e5]">{youthData?.youthId}</span>
                  </p>
                  <p className="text-[#a3a3a3]">
                    Program: <span className="font-semibold capitalize text-[#e5e5e5]">{youthData?.programType?.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>

              {/* Contract Status */}
              <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#dc2626] flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Training Agreement Accepted
                    </h3>
                    <p className="text-[#e5e5e5] text-sm mb-3">
                      You have successfully signed your training agreement. You can now access your assigned training materials.
                    </p>
                    <Link
                      href="/contract/review"
                      className="inline-flex items-center gap-2 text-sm text-[#dc2626] hover:text-[#b91c1c] transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      View Signed Contract
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Training Modules */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-heading font-bold text-white mb-6">
              Your Training Modules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((module, index) => (
                <CometCard key={index} rotateDepth={10} translateDepth={15}>
                  {module.available && !module.restricted ? (
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
                            Start Training →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 opacity-60 cursor-not-allowed h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-[#737373]">{module.icon}</div>
                        <span className="text-xs font-mono text-[#737373]">#{module.code}</span>
                      </div>

                      <h4 className="text-lg font-heading font-bold text-[#737373] mb-2">
                        {module.title}
                      </h4>

                      <p className="text-sm text-[#737373] mb-4">
                        {module.description}
                      </p>

                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#737373]" />
                        <span className="text-[#737373] text-sm font-semibold">
                          {module.restricted ? 'Staff Only' : 'Coming Soon'}
                        </span>
                      </div>
                    </div>
                  )}
                </CometCard>
              ))}
            </div>
          </div>

          {/* Resources Section */}
          <div className="max-w-5xl mx-auto mt-12">
            <h3 className="text-xl font-heading font-bold text-white mb-6">
              Resources & Support
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#e5e5e5]" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Your Contract</h4>
                    <p className="text-[#a3a3a3] text-sm mb-3">
                      View your signed training agreement.
                    </p>
                    <Link
                      href="/contract"
                      className="text-[#dc2626] text-sm hover:text-[#b91c1c]"
                    >
                      View Agreement
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-xl p-6">
                <h4 className="text-white font-semibold mb-2">Need Help?</h4>
                <p className="text-[#a3a3a3] text-sm">
                  If you have questions about your training program or need assistance, please contact your program coordinator.
                </p>
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
