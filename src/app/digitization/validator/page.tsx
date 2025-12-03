"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { CometCard } from "@/components/ui/comet-card";
import Link from "next/link";
import { validatorTrainingSteps } from "@/data/validator-training";
import { Clock, BookOpen, CheckCircle2, Lock, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasValidatorTrainingAccess } from "@/data/validator-training";

export default function ValidatorOverviewPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Check authentication status - Staff only
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const storedStaffId = sessionStorage.getItem('staffId');
    const storedStaffName = sessionStorage.getItem('staffName');

    // Check if user is staff
    if (userType !== 'staff' || !storedStaffId) {
      // Not staff - redirect to login
      router.push('/');
      return;
    }

    // Check if staff has validator training access
    if (hasValidatorTrainingAccess(storedStaffId)) {
      setStaffId(storedStaffId);
      setStaffName(storedStaffName);
      setIsAuthenticated(true);
    } else {
      // Staff doesn't have validator access
      router.push('/dashboard/staff');
      return;
    }

    setIsLoading(false);
  }, [router]);

  // Load completed steps
  useEffect(() => {
    if (isAuthenticated && staffId) {
      const saved = localStorage.getItem(`validator-completed-steps-${staffId}`);
      if (saved) {
        setCompletedSteps(new Set(JSON.parse(saved)));
      }
    }
  }, [isAuthenticated, staffId]);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('userType');
    router.push('/');
  };

  const totalTime = validatorTrainingSteps.reduce((sum, step) => sum + step.estimatedTime, 0);

  // Loading state
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

  // Show training content
  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />

      <FloatingHeader showBackButton backHref="/digitization" />

      <div className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Welcome Banner for Staff */}
          <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl p-4 mb-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#dc2626]" />
                <div>
                  <span className="text-white text-sm font-medium">
                    {staffName ? `Welcome, ${staffName}` : 'Authenticated Staff'}
                  </span>
                  <span className="text-[#a3a3a3] text-xs ml-2">
                    (ID: {staffId})
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-[#a3a3a3] hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#dc2626]" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
              Validator Training
            </h1>
            <p className="text-lg text-[#e5e5e5] max-w-3xl mx-auto mb-6">
              Master quality assurance, validation workflows, and the DPW Validation Tool to ensure mapping data meets professional standards.
            </p>
            <div className="flex items-center justify-center gap-6 text-[#a3a3a3]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{validatorTrainingSteps.length} Steps</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>~{totalTime} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{completedSteps.size}/{validatorTrainingSteps.length} Completed</span>
              </div>
            </div>
          </div>

          {/* Restricted Content Notice */}
          <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl p-4 mb-8 max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">Restricted Content - Staff Only</h3>
                <p className="text-[#a3a3a3] text-sm">
                  This training module contains proprietary validation workflows and tools restricted to Spatial Collective staff members.
                </p>
              </div>
            </div>
          </div>

          {/* Training Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validatorTrainingSteps.map((step) => {
              const isCompleted = completedSteps.has(step.id);

              return (
                <CometCard key={step.id} rotateDepth={10} translateDepth={15}>
                  <Link href={`/digitization/validator/${step.id}`}>
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 hover:border-[#dc2626]/50 transition-all h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#dc2626]/10 border border-[#dc2626]/30 flex items-center justify-center">
                            <span className="text-[#dc2626] font-heading font-bold text-sm">
                              {step.id.replace('validator-', '')}
                            </span>
                          </div>
                          {isCompleted && (
                            <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[#a3a3a3] text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{step.estimatedTime}m</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-heading font-bold text-white mb-2">
                        {step.title}
                      </h3>

                      <p className="text-sm text-[#a3a3a3] line-clamp-2">
                        {step.content.introduction}
                      </p>
                    </div>
                  </Link>
                </CometCard>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#262626] bg-black mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-[#a3a3a3]">
            🔒 Validator Training - Restricted Content - Spatial Collective Staff Only
          </p>
        </div>
      </div>
    </main>
  );
}
