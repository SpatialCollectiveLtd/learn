"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { CometCard } from "@/components/ui/comet-card";
import Link from "next/link";
import { validatorTrainingSteps } from "@/data/validator-training";
import { Clock, BookOpen, CheckCircle2, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getYouthSession, getTrainingProgress } from "@/lib/youth-client";

export default function ValidatorOverviewPage() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getYouthSession();
    if (!session) {
      router.push('/');
      return;
    }

    if (session.userType === 'staff') {
      router.replace(session.role === 'admin' ? '/admin' : '/trainer');
      return;
    }

    getTrainingProgress(session.token).then((data) => {
      if (data?.progress?.validator) {
        setCompletedSteps(new Set(data.progress.validator));
      }
      setIsLoading(false);
    });
  }, [router]);

  const totalTime = validatorTrainingSteps.reduce((sum, step) => sum + step.estimatedTime, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />

      <FloatingHeader showBackButton backHref="/digitization" />

      <div className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
              Validator Training
            </h1>
            <p className="text-lg text-[#e5e5e5] max-w-3xl mx-auto mb-6">
              Master data validation techniques, quality assurance, and ensure mapping accuracy across projects.
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validatorTrainingSteps.map((step, index) => {
              const stepNum = index + 1;
              const isCompleted = completedSteps.has(stepNum);
              const isUnlocked = stepNum === 1 || completedSteps.has(stepNum - 1);

              return (
                <CometCard key={step.id}>
                  <Link
                    href={isUnlocked ? `/digitization/validator/${stepNum}` : '#'}
                    className={isUnlocked ? '' : 'pointer-events-none'}
                  >
                    <div className={`bg-[#1F2121] border rounded-xl p-6 transition-all ${
                      isCompleted
                        ? 'border-[#22c55e]/40'
                        : isUnlocked
                        ? 'border-[#262626] hover:border-[#dc2626]'
                        : 'border-[#262626] opacity-60'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[#dc2626] font-heading font-bold text-sm">Step {stepNum}</span>
                          <span className="text-[#737373] text-xs">• {step.estimatedTime} min</span>
                        </div>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                        ) : !isUnlocked ? (
                          <Lock className="w-4 h-4 text-[#737373]" />
                        ) : null}
                      </div>
                      <h3 className="text-white font-subheading font-semibold text-base mb-2">
                        {step.title}
                      </h3>
                      <p className="text-[#a3a3a3] text-sm line-clamp-2">
                        {step.shortTitle}
                      </p>
                    </div>
                  </Link>
                </CometCard>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
