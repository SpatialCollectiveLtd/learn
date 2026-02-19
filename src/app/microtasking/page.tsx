"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { CometCard } from "@/components/ui/comet-card";
import Link from "next/link";
import { microtaskingSteps, MICROTASKING_PLATFORM_URL } from "@/data/microtasking-training";
import { Clock, BookOpen, CheckCircle2, Circle, Lock, ExternalLink, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

export default function MicrotaskingOverviewPage() {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [allTrainingComplete, setAllTrainingComplete] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('microtasking-completed-steps');
    if (saved) {
      const completed = new Set<number>(JSON.parse(saved));
      setCompletedSteps(completed);
      
      setAllTrainingComplete(completed.size === 3);
    }
  }, []);

  const totalTime = microtaskingSteps.reduce((sum, step) => sum + step.estimatedTime, 0);

  const isStepUnlocked = (stepId: number): boolean => {
    if (stepId === 1) return true; 
    return completedSteps.has(stepId - 1); 
  };

  const handleLaunchPlatform = () => {
    window.open(MICROTASKING_PLATFORM_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />
      
      <FloatingHeader showBackButton backHref="/dashboard" />
      
      <div className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Smartphone className="w-12 h-12 text-blue-400 mr-3" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white">
                Microtasking Training
              </h1>
            </div>
            <p className="text-lg text-[#e5e5e5] max-w-3xl mx-auto mb-6">
              Learn how to complete simple image classification tasks on your smartphone and earn at your own pace.
            </p>
            <div className="flex items-center justify-center gap-6 text-[#a3a3a3]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{microtaskingSteps.length} Steps</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>~{totalTime} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{completedSteps.size}/{microtaskingSteps.length} Completed</span>
              </div>
            </div>
          </div>

          {}
          {allTrainingComplete && (
            <div className="mb-8">
              <CometCard className="p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/30">
                <div className="flex flex-col items-center text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Training Complete! 🎉
                  </h2>
                  <p className="text-[#e5e5e5] mb-6 max-w-2xl">
                    Congratulations! You've completed all training steps. You're now ready to start completing microtasks 
                    and earning on the platform. Click below to launch the microtasking platform.
                  </p>
                  <button
                    onClick={handleLaunchPlatform}
                    className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 
                             hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg 
                             transition-all duration-300 shadow-lg shadow-blue-500/50 hover:shadow-blue-400/60 hover:scale-105"
                  >
                    <Smartphone className="w-5 h-5" />
                    <span>Launch Microtasking Platform</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <p className="text-sm text-[#a3a3a3] mt-3">
                    Opens {MICROTASKING_PLATFORM_URL} in a new tab
                  </p>
                </div>
              </CometCard>
            </div>
          )}

          {}
          <div className="mb-8">
            <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#a3a3a3]">Training Progress</span>
                <span className="text-sm font-semibold text-white">
                  {completedSteps.size}/{microtaskingSteps.length} Steps
                </span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500 ease-out"
                  style={{ width: `${(completedSteps.size / microtaskingSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
            {microtaskingSteps.map((step) => {
              const isCompleted = completedSteps.has(step.id);
              const isUnlocked = isStepUnlocked(step.id);
              
              return (
                <Link
                  key={step.id}
                  href={isUnlocked ? `/microtasking/${step.id}` : '#'}
                  className={`block ${!isUnlocked ? 'cursor-not-allowed' : ''}`}
                >
                  <CometCard 
                    className={`p-6 transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-900/20 border-green-500/30 hover:bg-green-900/30' 
                        : isUnlocked
                        ? 'bg-neutral-900/50 border-neutral-700 hover:bg-neutral-800/50'
                        : 'bg-neutral-900/30 border-neutral-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {}
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-8 h-8 text-green-400" />
                        ) : isUnlocked ? (
                          <Circle className="w-8 h-8 text-blue-400" />
                        ) : (
                          <Lock className="w-8 h-8 text-neutral-600" />
                        )}
                      </div>

                      {}
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-heading font-bold text-white">
                            Step {step.id}: {step.title}
                          </h3>
                          {isCompleted && (
                            <span className="px-2 py-1 text-xs font-semibold bg-green-500/20 text-green-400 rounded-full">
                              Completed
                            </span>
                          )}
                          {!isUnlocked && (
                            <span className="px-2 py-1 text-xs font-semibold bg-neutral-700/50 text-neutral-400 rounded-full">
                              Locked
                            </span>
                          )}
                        </div>

                        <p className="text-[#a3a3a3] mb-4 leading-relaxed">
                          {step.content.introduction}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-[#a3a3a3]">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>~{step.estimatedTime} min</span>
                          </div>
                          {!isUnlocked && (
                            <div className="flex items-center gap-1 text-amber-400">
                              <Lock className="w-4 h-4" />
                              <span>Complete Step {step.id - 1} first</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CometCard>
                </Link>
              );
            })}
          </div>

          {}
          <div className="mt-8">
            <CometCard className="p-4 sm:p-6 bg-blue-900/20 border-blue-500/30">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Smartphone className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1 mx-auto sm:mx-0" />
                <div className="flex-1 w-full text-center sm:text-left">
                  <h3 className="text-lg font-bold text-white mb-2">
                    About the Microtasking Platform
                  </h3>
                  <p className="text-[#e5e5e5] mb-3">
                    You'll be working on a web-based platform accessible from any smartphone browser. 
                    No app installation required - just visit the website and login with your phone number.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-blue-400" />
                      <span className="text-[#a3a3a3]">Platform URL:</span>
                    </div>
                    <a 
                      href={MICROTASKING_PLATFORM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline break-all"
                    >
                      {MICROTASKING_PLATFORM_URL}
                    </a>
                  </div>
                </div>
              </div>
            </CometCard>
          </div>

          {}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#a3a3a3]">
              Complete all {microtaskingSteps.length} training steps in order to unlock the platform. 
              Each step builds on the previous one.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
