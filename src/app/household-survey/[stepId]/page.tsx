"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { MovingBorderButton } from "@/components/ui/moving-border-button";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Lightbulb,
  Clock,
  BookOpen,
} from "lucide-react";
import { householdSurveySteps } from "@/data/household-survey-training";
import { getYouthSession, getTrainingProgress, markStepComplete } from "@/lib/youth-client";

export default function HouseholdSurveyStepPage({
  params,
}: {
  params: Promise<{ stepId: string }>;
}) {
  const { stepId } = use(params);
  const router = useRouter();
  const currentStepId = parseInt(stepId);

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isStepLocked, setIsStepLocked] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  const currentStep = householdSurveySteps.find((s) => s.id === currentStepId);
  const currentIndex = householdSurveySteps.findIndex((s) => s.id === currentStepId);
  const previousStep = currentIndex > 0 ? householdSurveySteps[currentIndex - 1] : null;
  const nextStep =
    currentIndex < householdSurveySteps.length - 1
      ? householdSurveySteps[currentIndex + 1]
      : null;

  useEffect(() => {
    const fetchData = async () => {
      const session = getYouthSession();
      if (!session) {
        setIsLoadingProgress(false);
        return;
      }

      const data = await getTrainingProgress(session.token);
      if (data?.progress?.household_survey) {
        const completed = new Set<number>(data.progress.household_survey);
        setCompletedSteps(completed);
        if (currentStepId > 1 && !completed.has(currentStepId - 1)) {
          setIsStepLocked(true);
          const lastCompleted = Math.max(...Array.from(completed), 0);
          const nextAvailable = lastCompleted + 1;
          if (nextAvailable < currentStepId) {
            setTimeout(() => router.push(`/household-survey/${nextAvailable}`), 2000);
          }
        }
      }
      setIsLoadingProgress(false);
    };

    fetchData();
  }, [currentStepId, router]);

  const handleMarkComplete = async () => {
    const session = getYouthSession();
    if (!session) {
      router.push("/");
      return;
    }

    const result = await markStepComplete(session.token, "household_survey", currentStepId);
    if (result.success) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStepId);
      setCompletedSteps(newCompleted);
      if (nextStep) {
        setTimeout(() => router.push(`/household-survey/${nextStep.id}`), 500);
      } else {
        setTimeout(() => router.push("/household-survey"), 1000);
      }
    } else if (result.missingStep) {
      router.push(`/household-survey/${result.missingStep}`);
    } else {
      alert(result.error || "Failed to save progress. Please try again.");
    }
  };

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Step not found
      </div>
    );
  }

  if (isLoadingProgress) {
    return (
      <main className="min-h-screen bg-black relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <FloatingHeader showBackButton backHref="/household-survey" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-foreground-muted">Loading training progress...</p>
          </div>
        </div>
      </main>
    );
  }

  if (isStepLocked) {
    const requiredStep = currentStepId - 1;
    return (
      <main className="min-h-screen bg-black relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <FloatingHeader showBackButton backHref="/household-survey" />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full bg-background-elevated border border-primary/30 rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-3">Step Locked</h2>
            <p className="text-foreground-muted mb-6">
              You must complete{" "}
              <span className="text-primary font-semibold">Step {requiredStep}</span> before
              accessing this step.
            </p>
            <button
              onClick={() => router.push(`/household-survey/${requiredStep}`)}
              className="bg-primary text-white px-6 py-3 rounded-lg font-subheading font-semibold hover:bg-primary-hover transition-colors"
            >
              Go to Step {requiredStep}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isCompleted = completedSteps.has(currentStepId);

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />
      <FloatingHeader showBackButton backHref="/household-survey" />

      <div className="relative z-10 pt-20 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Step header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="text-primary font-heading font-bold text-lg">
                  {currentStep.id}
                </span>
              </div>
              <div>
                <p className="text-foreground-subtle text-sm">
                  Step {currentStep.id} of {householdSurveySteps.length}
                </p>
                <div className="flex items-center gap-2 text-foreground-subtle text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentStep.estimatedTime} minutes</span>
                </div>
              </div>
              {isCompleted && (
                <div className="ml-auto flex items-center gap-1.5 text-success text-sm">
                  <Check className="w-4 h-4" />
                  <span>Completed</span>
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
              {currentStep.title}
            </h1>

            <div className="w-full h-2 bg-background-card rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-300"
                style={{
                  width: `${(currentStepId / householdSurveySteps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Introduction */}
          <div className="bg-background-card border border-border rounded-xl p-6 mb-8">
            <p className="text-foreground-muted text-lg leading-relaxed">
              {currentStep.content.introduction}
            </p>
          </div>

          {/* Main content blocks */}
          <div className="space-y-6">
            {currentStep.content.mainContent.map((block, index) => {
              if (block.type === "text") {
                return (
                  <div
                    key={index}
                    className="bg-background-elevated border border-border rounded-xl p-6"
                  >
                    {block.title && (
                      <h3 className="text-xl font-subheading font-bold text-white mb-3">
                        {block.title}
                      </h3>
                    )}
                    <p className="text-foreground-muted leading-relaxed">
                      {block.content as string}
                    </p>
                  </div>
                );
              }

              if (block.type === "list") {
                return (
                  <div
                    key={index}
                    className="bg-background-elevated border border-border rounded-xl p-6"
                  >
                    {block.title && (
                      <h3 className="text-xl font-subheading font-bold text-white mb-4">
                        {block.title}
                      </h3>
                    )}
                    <ul className="space-y-3">
                      {(block.content as string[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-primary text-xs font-bold">{i + 1}</span>
                          </div>
                          <span className="text-foreground-muted">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }

              if (block.type === "warning") {
                return (
                  <div
                    key={index}
                    className="bg-warning/10 border border-warning/30 rounded-xl p-6"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                      <p className="text-foreground-muted">{block.content as string}</p>
                    </div>
                  </div>
                );
              }

              if (block.type === "tip") {
                return (
                  <div
                    key={index}
                    className="bg-info/10 border border-info/30 rounded-xl p-6"
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-6 h-6 text-info flex-shrink-0 mt-0.5" />
                      <p className="text-foreground-muted">{block.content as string}</p>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Key takeaways */}
          {currentStep.content.keyTakeaways && (
            <div className="mt-8 bg-gradient-to-r from-primary/10 to-primary-dark/10 border border-primary/30 rounded-xl p-6">
              <h3 className="text-xl font-subheading font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Key Takeaways
              </h3>
              <ul className="space-y-2">
                {currentStep.content.keyTakeaways.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-foreground-muted">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-4">
          <div className="flex items-center justify-between gap-4">
            {previousStep ? (
              <button
                onClick={() => router.push(`/household-survey/${previousStep.id}`)}
                className="flex items-center gap-2 text-foreground-subtle hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Previous</span>
              </button>
            ) : (
              <div />
            )}

            <MovingBorderButton onClick={handleMarkComplete} className="px-6 py-3">
              <span className="flex items-center gap-2">
                {isCompleted ? (
                  nextStep ? (
                    <>
                      <span>Next Step</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Training Complete!</span>
                    </>
                  )
                ) : (
                  <>
                    <span>Mark Complete & Continue</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </span>
            </MovingBorderButton>

            {nextStep && isCompleted ? (
              <button
                onClick={() => router.push(`/household-survey/${nextStep.id}`)}
                className="flex items-center gap-2 text-foreground-subtle hover:text-white transition-colors"
              >
                <span className="hidden sm:inline">Skip to Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
