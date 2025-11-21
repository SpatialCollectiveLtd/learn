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
  BookOpen
} from "lucide-react";
import { mapperTrainingSteps, getStepById, getNextStep, getPreviousStep } from "@/data/mapper-training";

export default function MapperTrainingStepPage({
  params,
}: {
  params: Promise<{ stepId: string }>;
}) {
  const { stepId } = use(params);
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  const currentStepId = parseInt(stepId);
  const currentStep = getStepById(currentStepId);
  const nextStep = getNextStep(currentStepId);
  const previousStep = getPreviousStep(currentStepId);

  // Load completed steps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mapper-completed-steps');
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }
  }, []);

  const markStepComplete = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStepId);
    setCompletedSteps(newCompleted);
    localStorage.setItem('mapper-completed-steps', JSON.stringify(Array.from(newCompleted)));
    
    // Auto-navigate to next step
    if (nextStep) {
      setTimeout(() => {
        router.push(`/digitization/mapper/${nextStep.id}`);
      }, 500);
    }
  };

  if (!currentStep) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Step not found</div>;
  }

  const progress = (currentStepId / mapperTrainingSteps.length) * 100;

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />
      
      <FloatingHeader showBackButton backHref="/digitization" />
      
      <div className="relative z-10 pt-20 pb-12">
        {/* Progress Bar */}
        <div className="fixed top-[72px] left-0 right-0 z-40 h-1 bg-[#262626]">
          <div 
            className="h-full bg-gradient-to-r from-[#dc2626] to-[#ef4444] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Step Header */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 text-[#a3a3a3] text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Step {currentStepId} of {mapperTrainingSteps.length}</span>
              </div>
              <div className="flex items-center gap-2 text-[#a3a3a3] text-sm">
                <Clock className="w-4 h-4" />
                <span>{currentStep.estimatedTime} min</span>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
              {currentStep.title}
            </h1>
            
            <p className="text-lg text-[#e5e5e5] leading-relaxed">
              {currentStep.content.introduction}
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8 mb-12">
            {currentStep.content.mainContent.map((block, index) => (
              <div key={index}>
                {block.type === 'text' && (
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6">
                    {block.title && (
                      <h3 className="text-xl font-subheading font-bold text-white mb-4">
                        {block.title}
                      </h3>
                    )}
                    <p className="text-[#e5e5e5] leading-relaxed">{block.content as string}</p>
                  </div>
                )}

                {block.type === 'list' && (
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6">
                    {block.title && (
                      <h3 className="text-xl font-subheading font-bold text-white mb-4">
                        {block.title}
                      </h3>
                    )}
                    <ul className="space-y-3">
                      {(block.content as string[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[#e5e5e5]">
                          <Check className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {block.type === 'warning' && (
                  <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="w-6 h-6 text-[#dc2626] flex-shrink-0" />
                      <p className="text-[#e5e5e5] leading-relaxed">{block.content as string}</p>
                    </div>
                  </div>
                )}

                {block.type === 'tip' && (
                  <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <Lightbulb className="w-6 h-6 text-[#3b82f6] flex-shrink-0" />
                      <p className="text-[#e5e5e5] leading-relaxed">{block.content as string}</p>
                    </div>
                  </div>
                )}

                {block.type === 'image' && (
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6">
                    {block.title && (
                      <h3 className="text-xl font-subheading font-bold text-white mb-4">
                        {block.title}
                      </h3>
                    )}
                    <div className="aspect-video bg-[#262626] rounded-lg flex items-center justify-center">
                      <p className="text-[#a3a3a3] text-sm">Screenshot: {block.imageAlt}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Key Takeaways */}
          {currentStep.content.keyTakeaways && (
            <div className="bg-gradient-to-r from-[#dc2626]/10 to-[#dc2626]/5 border border-[#dc2626]/20 rounded-xl p-6 mb-12">
              <h3 className="text-xl font-subheading font-bold text-white mb-4">
                Key Takeaways
              </h3>
              <ul className="space-y-3">
                {currentStep.content.keyTakeaways.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#e5e5e5]">
                    <Check className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            {previousStep ? (
              <MovingBorderButton
                onClick={() => router.push(`/digitization/mapper/${previousStep.id}`)}
                className="flex-1 max-w-[200px]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </MovingBorderButton>
            ) : (
              <div className="flex-1 max-w-[200px]" />
            )}

            <button
              onClick={markStepComplete}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                completedSteps.has(currentStepId)
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-[#dc2626] text-white hover:bg-[#ef4444]'
              }`}
            >
              {completedSteps.has(currentStepId) ? (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Completed
                </span>
              ) : (
                'Mark Complete'
              )}
            </button>

            {nextStep ? (
              <MovingBorderButton
                onClick={() => router.push(`/digitization/mapper/${nextStep.id}`)}
                className="flex-1 max-w-[200px]"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </MovingBorderButton>
            ) : (
              <MovingBorderButton
                onClick={() => router.push('/digitization')}
                className="flex-1 max-w-[200px]"
              >
                <span>Finish</span>
                <Check className="w-4 h-4" />
              </MovingBorderButton>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
