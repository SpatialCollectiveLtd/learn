"use client";

import { use, useEffect, useState } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { MarkdownContent } from "@/components/ui/markdown-content";
import {
  getValidatorStepById,
  getNextValidatorStep,
  getPreviousValidatorStep,
  hasValidatorTrainingAccess,
  validatorTrainingSteps,
  type TrainingStep
} from "@/data/validator-training";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Lock,
  AlertTriangle,
  Lightbulb,
  ListOrdered
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ stepId: string }>;
}

export default function ValidatorStepPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const step = getValidatorStepById(resolvedParams.stepId, staffId || undefined);
  const nextStep = getNextValidatorStep(resolvedParams.stepId);
  const previousStep = getPreviousValidatorStep(resolvedParams.stepId);

  // Check authentication - Staff only
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const storedStaffId = sessionStorage.getItem('staffId');

    // Check if user is staff
    if (userType !== 'staff' || !storedStaffId) {
      router.push('/');
      return;
    }

    // Check if staff has validator training access
    if (hasValidatorTrainingAccess(storedStaffId)) {
      setStaffId(storedStaffId);
      setIsAuthenticated(true);
    } else {
      router.push('/dashboard/staff');
      return;
    }
    setIsLoading(false);
  }, [router]);

  // Check if step is completed
  useEffect(() => {
    if (isAuthenticated && staffId && step) {
      const saved = localStorage.getItem(`validator-completed-steps-${staffId}`);
      if (saved) {
        const completedSteps = new Set(JSON.parse(saved));
        setIsCompleted(completedSteps.has(step.id));
      }
    }
  }, [isAuthenticated, staffId, step]);

  const toggleComplete = () => {
    if (!staffId || !step) return;

    const saved = localStorage.getItem(`validator-completed-steps-${staffId}`);
    const completedSteps = saved ? new Set(JSON.parse(saved)) : new Set();

    if (isCompleted) {
      completedSteps.delete(step.id);
    } else {
      completedSteps.add(step.id);
    }

    localStorage.setItem(
      `validator-completed-steps-${staffId}`,
      JSON.stringify(Array.from(completedSteps))
    );
    setIsCompleted(!isCompleted);
  };

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

  // Step not found
  if (!step) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-heading font-bold text-white mb-4">
            Step Not Found
          </h2>
          <p className="text-[#a3a3a3] mb-6">
            The requested training step could not be found.
          </p>
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

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-20" />

      <FloatingHeader showBackButton backHref="/digitization/validator" />

      <div className="relative z-10 pt-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Staff Info Badge */}
          <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-lg px-4 py-2 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#a3a3a3]">
              <Lock className="w-3.5 h-3.5 text-[#dc2626]" />
              <span className="text-white">Staff ID: {staffId}</span>
            </div>
            <div className="text-xs text-[#dc2626]">
              🔒 Restricted Content
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-[#a3a3a3] mb-2">
              <span>Step {step.id.replace('validator-', '')} of {validatorTrainingSteps.length}</span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{step.estimatedTime} min</span>
              </div>
            </div>
            <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#dc2626] transition-all"
                style={{
                  width: `${(parseInt(step.id.replace('validator-', '')) / validatorTrainingSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Title */}
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
              {step.title}
            </h1>
            <p className="text-lg text-[#e5e5e5] leading-relaxed">
              {step.content.introduction}
            </p>
          </header>

          {/* Main Content */}
          <div className="prose prose-invert max-w-none">
            {step.content.mainContent.map((block, index) => {
              if (block.type === 'text') {
                return (
                  <div key={index} className="mb-6">
                    <MarkdownContent content={block.content} />
                  </div>
                );
              }

              if (block.type === 'list' && block.items) {
                return (
                  <div key={index} className="mb-6">
                    {block.content && (
                      <div className="mb-3">
                        <MarkdownContent content={block.content} />
                      </div>
                    )}
                    <ul className="space-y-2 text-[#e5e5e5] ml-6">
                      {block.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#dc2626] mt-1.5">•</span>
                          <span className="flex-1"><MarkdownContent content={item} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }

              if (block.type === 'warning') {
                return (
                  <div key={index} className="mb-6 bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-[#dc2626] flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <MarkdownContent content={block.content} />
                      </div>
                    </div>
                  </div>
                );
              }

              if (block.type === 'tip') {
                return (
                  <div key={index} className="mb-6 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-6 h-6 text-[#22c55e] flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <MarkdownContent content={block.content} />
                      </div>
                    </div>
                  </div>
                );
              }

              if (block.type === 'steps' && block.items) {
                return (
                  <div key={index} className="mb-6">
                    {block.content && (
                      <div className="mb-4 flex items-center gap-2">
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
                          <span className="flex-1 pt-1"><MarkdownContent content={item} /></span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Key Takeaways */}
          {step.content.keyTakeaways && step.content.keyTakeaways.length > 0 && (
            <div className="mt-12 bg-[#0a0a0a] border border-[#262626] rounded-xl p-6">
              <h3 className="text-xl font-subheading font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                Key Takeaways
              </h3>
              <ul className="space-y-2">
                {step.content.keyTakeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start gap-3 text-[#e5e5e5]">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-1" />
                    <span><MarkdownContent content={takeaway} /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Complete Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={toggleComplete}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-subheading font-semibold transition-all ${
                isCompleted
                  ? 'bg-[#22c55e] hover:bg-[#16a34a] text-white'
                  : 'bg-[#262626] hover:bg-[#404040] text-white border border-[#404040]'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="w-5 h-5" />
                  Mark as Complete
                </>
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-12 pt-8 border-t border-[#262626] flex items-center justify-between gap-4">
            {previousStep ? (
              <Link
                href={`/digitization/validator/${previousStep.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-[#0a0a0a] border border-[#262626] hover:border-[#dc2626]/50 text-white rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </Link>
            ) : (
              <div />
            )}

            {nextStep ? (
              <Link
                href={`/digitization/validator/${nextStep.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-[#dc2626] hover:bg-[#ef4444] text-white rounded-lg transition-all"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/digitization/validator"
                className="flex items-center gap-2 px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete Training</span>
              </Link>
            )}
          </nav>
        </article>
      </div>
    </main>
  );
}
