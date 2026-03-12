"use client";

import { use, useEffect, useState } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { MovingBorderButton } from "@/components/ui/moving-border-button";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { validatorTrainingSteps } from "@/data/validator-training";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ListOrdered,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getYouthSession, getTrainingProgress, markStepComplete } from "@/lib/youth-client";

interface PageProps {
  params: Promise<{ stepId: string }>;
}

export default function ValidatorStepPage({ params }: PageProps) {
  const { stepId } = use(params);
  const router = useRouter();
  const stepNum = parseInt(stepId);

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isStepLocked, setIsStepLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const stepIndex = stepNum - 1;
  const step = validatorTrainingSteps[stepIndex];
  const nextStep = validatorTrainingSteps[stepIndex + 1] ?? null;
  const previousStep = stepIndex > 0 ? validatorTrainingSteps[stepIndex - 1] : null;

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
      const completed = new Set<number>(data?.progress?.validator ?? []);
      setCompletedSteps(completed);

      if (stepNum > 1 && !completed.has(stepNum - 1)) {
        setIsStepLocked(true);
        const lastCompleted = Math.max(...Array.from(completed), 0);
        const nextAvailable = lastCompleted + 1;
        if (nextAvailable < stepNum) {
          setTimeout(() => router.push(`/digitization/validator/${nextAvailable}`), 2000);
        }
      }

      setIsLoading(false);
    });
  }, [stepNum, router]);

  const handleMarkComplete = async () => {
    const session = getYouthSession();
    if (!session) {
      alert('Authentication required. Please login again.');
      router.push('/');
      return;
    }

    const result = await markStepComplete(session.token, 'validator', stepNum);

    if (result.success) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(stepNum);
      setCompletedSteps(newCompleted);

      if (nextStep) {
        setTimeout(() => router.push(`/digitization/validator/${stepNum + 1}`), 500);
      } else {
        setTimeout(() => router.push('/digitization/validator'), 1000);
      }
    } else {
      alert(result.error || 'Failed to save progress. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <FloatingHeader showBackButton backHref="/digitization/validator" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#dc2626] mx-auto mb-4" />
            <p className="text-[#e5e5e5]">Loading training progress...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!step) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-heading font-bold text-white mb-4">Step Not Found</h2>
          <p className="text-[#a3a3a3] mb-6">The requested training step could not be found.</p>
          <Link
            href="/digitization/validator"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#dc2626] hover:bg-[#ef4444] text-white rounded-lg font-subheading font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Training Overview
          </Link>
        </div>
      </div>
    );
  }

  if (isStepLocked) {
    const requiredStep = stepNum - 1;
    return (
      <main className="min-h-screen bg-black relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <FloatingHeader showBackButton backHref="/digitization/validator" />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full bg-[#0a0a0a] border border-[#dc2626]/30 rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#dc2626]/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-[#dc2626]" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-3">Step Locked</h2>
            <p className="text-[#e5e5e5] mb-6">
              You must complete <span className="text-[#dc2626] font-semibold">Step {requiredStep}</span> before accessing this step.
            </p>
            <MovingBorderButton onClick={() => router.push(`/digitization/validator/${requiredStep}`)} className="w-full">
              Go to Step {requiredStep}
            </MovingBorderButton>
          </div>
        </div>
      </main>
    );
  }

  const isCompleted = completedSteps.has(stepNum);
  const progress = (stepNum / validatorTrainingSteps.length) * 100;

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-20" />
      <FloatingHeader showBackButton backHref="/digitization/validator" />

      {/* Progress bar */}
      <div className="fixed top-[72px] left-0 right-0 z-40 h-1 bg-[#262626]">
        <div className="h-full bg-gradient-to-r from-[#dc2626] to-[#ef4444] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="relative z-10 pt-20 pb-12">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Step meta */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2 text-[#a3a3a3] text-sm">
              <BookOpen className="w-4 h-4" />
              <span>Step {stepNum} of {validatorTrainingSteps.length}</span>
              <span>•</span>
              <Clock className="w-4 h-4" />
              <span>{step.estimatedTime} min</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">{step.title}</h1>
            <p className="text-lg text-[#e5e5e5] leading-relaxed">{step.content.introduction}</p>
          </div>

          {/* Main content */}
          <div className="space-y-6 mb-12">
            {step.content.mainContent.map((block, index) => {
              if (block.type === 'text') {
                return (
                  <div key={index} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 text-[#e5e5e5]">
                    <MarkdownContent content={block.content} />
                  </div>
                );
              }

              if (block.type === 'list' && block.items) {
                return (
                  <div key={index} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6">
                    {block.content && (
                      <div className="mb-3 font-subheading font-semibold text-white">
                        <MarkdownContent content={block.content} />
                      </div>
                    )}
                    <ul className="space-y-2 text-[#e5e5e5]">
                      {block.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#dc2626] mt-1 flex-shrink-0">•</span>
                          <span><MarkdownContent content={item} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }

              if (block.type === 'warning') {
                return (
                  <div key={index} className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-[#dc2626] flex-shrink-0 mt-1" />
                      <div className="text-[#e5e5e5]"><MarkdownContent content={block.content} /></div>
                    </div>
                  </div>
                );
              }

              if (block.type === 'tip') {
                return (
                  <div key={index} className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-6 h-6 text-[#3b82f6] flex-shrink-0 mt-1" />
                      <div className="text-[#e5e5e5]"><MarkdownContent content={block.content} /></div>
                    </div>
                  </div>
                );
              }

              if (block.type === 'steps' && block.items) {
                return (
                  <div key={index} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6">
                    {block.content && (
                      <div className="mb-4 flex items-center gap-2 text-white font-subheading font-semibold">
                        <ListOrdered className="w-5 h-5 text-[#dc2626]" />
                        <MarkdownContent content={block.content} />
                      </div>
                    )}
                    <ol className="space-y-4">
                      {block.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#dc2626]/20 border border-[#dc2626]/40 flex items-center justify-center text-[#dc2626] font-semibold text-sm">
                            {i + 1}
                          </span>
                          <span className="flex-1 pt-1 text-[#e5e5e5]"><MarkdownContent content={item} /></span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Key takeaways */}
          {step.content.keyTakeaways && step.content.keyTakeaways.length > 0 && (
            <div className="bg-gradient-to-r from-[#dc2626]/10 to-[#dc2626]/5 border border-[#dc2626]/20 rounded-xl p-6 mb-12">
              <h3 className="text-lg font-subheading font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                Key Takeaways
              </h3>
              <ul className="space-y-2">
                {step.content.keyTakeaways.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#e5e5e5]">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-1" />
                    <span><MarkdownContent content={item} /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {previousStep ? (
              <MovingBorderButton
                onClick={() => router.push(`/digitization/validator/${stepNum - 1}`)}
                className="w-full sm:flex-1 sm:max-w-[180px]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </MovingBorderButton>
            ) : (
              <div className="hidden sm:block sm:flex-1 sm:max-w-[180px]" />
            )}

            <button
              onClick={handleMarkComplete}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                isCompleted ? 'bg-[#22c55e] text-white' : 'bg-[#dc2626] text-white hover:bg-[#ef4444]'
              }`}
            >
              {isCompleted ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </span>
              ) : (
                'Mark Complete'
              )}
            </button>

            {nextStep ? (
              <button
                onClick={() => {
                  if (isCompleted) router.push(`/digitization/validator/${stepNum + 1}`);
                  else alert('Please complete this step before proceeding to the next one.');
                }}
                disabled={!isCompleted}
                className={`w-full sm:flex-1 sm:max-w-[180px] px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-[#dc2626] to-[#ef4444] text-white hover:opacity-90'
                    : 'bg-[#262626] text-[#737373] cursor-not-allowed'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (isCompleted) router.push('/digitization/validator');
                  else alert('Please complete this step to finish the validator training.');
                }}
                disabled={!isCompleted}
                className={`w-full sm:flex-1 sm:max-w-[180px] px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-[#dc2626] to-[#ef4444] text-white hover:opacity-90'
                    : 'bg-[#262626] text-[#737373] cursor-not-allowed'
                }`}
              >
                <span>Finish</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
