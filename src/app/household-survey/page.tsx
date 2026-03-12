"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { CometCard } from "@/components/ui/comet-card";
import Link from "next/link";
import { householdSurveySteps } from "@/data/household-survey-training";
import { Clock, BookOpen, CheckCircle2, Lock, ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { getYouthSession, getTrainingProgress } from "@/lib/youth-client";

export default function HouseholdSurveyOverviewPage() {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    const session = getYouthSession();
    if (!session?.token) return;
    getTrainingProgress(session.token).then((data) => {
      if (data?.progress?.household_survey) {
        setCompletedSteps(new Set(data.progress.household_survey));
      }
    });
  }, []);

  const totalTime = householdSurveySteps.reduce((sum, s) => sum + s.estimatedTime, 0);

  const isStepUnlocked = (stepId: number): boolean => {
    if (stepId === 1) return true;
    return completedSteps.has(stepId - 1);
  };

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />

      <FloatingHeader showBackButton backHref="/dashboard" />

      <div className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
              <ClipboardList className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
              Household Survey Training
            </h1>
            <p className="text-lg text-foreground-muted max-w-3xl mx-auto mb-4">
              Learn how to conduct community household surveys using ODK Collect
            </p>
            <div className="flex items-center justify-center gap-6 text-foreground-subtle">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{householdSurveySteps.length} Steps</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>~{totalTime} min</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{completedSteps.size}/{householdSurveySteps.length} Done</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="bg-background-card border border-border rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground-subtle">Training Progress</span>
                <span className="text-primary font-semibold">
                  {Math.round((completedSteps.size / householdSurveySteps.length) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-background-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500"
                  style={{ width: `${(completedSteps.size / householdSurveySteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Step cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {householdSurveySteps.map((step) => {
              const isCompleted = completedSteps.has(step.id);
              const unlocked = isStepUnlocked(step.id);

              return (
                <CometCard key={step.id} rotateDepth={10} translateDepth={15}>
                  {unlocked ? (
                    <Link href={`/household-survey/${step.id}`}>
                      <div className="bg-background-elevated border border-border rounded-xl p-6 hover:border-primary/50 transition-all h-full">
                        <StepCardContent step={step} isCompleted={isCompleted} />
                      </div>
                    </Link>
                  ) : (
                    <div className="bg-background-elevated border border-border rounded-xl p-6 opacity-60 cursor-not-allowed h-full">
                      <StepCardContent step={step} isCompleted={false} locked />
                    </div>
                  )}
                </CometCard>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

function StepCardContent({
  step,
  isCompleted,
  locked,
}: {
  step: (typeof householdSurveySteps)[number];
  isCompleted: boolean;
  locked?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/30">
          {locked ? (
            <Lock className="w-5 h-5 text-foreground-subtle" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <span className="text-primary font-heading font-bold">{step.id}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-foreground-subtle text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{step.estimatedTime}m</span>
        </div>
      </div>

      <h3 className="text-lg font-heading font-bold text-white mb-2">{step.title}</h3>
      <p className="text-sm text-foreground-subtle line-clamp-2">{step.content.introduction}</p>

      <div className="mt-4 pt-4 border-t border-border">
        <span className="text-primary text-sm font-subheading font-semibold">
          {locked ? 'Complete previous step →' : isCompleted ? 'Review →' : 'Start →'}
        </span>
      </div>
    </>
  );
}
