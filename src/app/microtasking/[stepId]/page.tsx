"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { MovingBorderButton } from "@/components/ui/moving-border-button";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  ChevronLeft, 
  ChevronRight,
  Check,
  AlertTriangle,
  Lightbulb,
  Clock,
  BookOpen,
  ExternalLink,
  Smartphone
} from "lucide-react";
import { microtaskingSteps, MICROTASKING_PLATFORM_URL } from "@/data/microtasking-training";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';


function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 break-all"
        >
          <span className="break-all">{part}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      );
    }
    return part;
  });
}

export default function MicrotaskingStepPage({ params }: { params: Promise<{ stepId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const stepId = parseInt(resolvedParams.stepId);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = microtaskingSteps.find(s => s.id === stepId);

  useEffect(() => {
    if (!step) {
      router.push('/microtasking');
      return;
    }

    
    const saved = localStorage.getItem('microtasking-completed-steps');
    if (saved) {
      const completed = new Set<number>(JSON.parse(saved));
      setIsCompleted(completed.has(stepId));
    }
  }, [stepId, step, router]);

  if (!step) {
    return null;
  }

  const handleMarkComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('youthToken');
      if (!token) {
        router.push('/');
        return;
      }

      
      const response = await axios.post(
        `${API_URL}/api/youth/training-progress`,
        {
          moduleType: 'microtasking',
          stepId: stepId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        
        const saved = localStorage.getItem('microtasking-completed-steps');
        const completed = saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
        completed.add(stepId);
        localStorage.setItem('microtasking-completed-steps', JSON.stringify([...completed]));
        
        setIsCompleted(true);

        
        setTimeout(() => {
          if (stepId < microtaskingSteps.length) {
            router.push(`/microtasking/${stepId + 1}`);
          } else {
            router.push('/microtasking');
          }
        }, 1000);
      }
    } catch (err: any) {
      
      setError(err.response?.data?.message || 'Failed to mark step as complete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previousStep = stepId > 1 ? microtaskingSteps[stepId - 2] : null;
  const nextStep = stepId < microtaskingSteps.length ? microtaskingSteps[stepId] : null;

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />
      
      <FloatingHeader showBackButton backHref="/microtasking" />
      
      <div className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-sm text-[#a3a3a3] mb-3">
              <Smartphone className="w-4 h-4" />
              <span>Microtasking Training</span>
              <span>•</span>
              <span>Step {stepId} of {microtaskingSteps.length}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-3">
              {step.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-[#a3a3a3]">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>~{step.estimatedTime} minutes</span>
              </div>
              {isCompleted && (
                <div className="flex items-center gap-1 text-green-400">
                  <Check className="w-4 h-4" />
                  <span>Completed</span>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="mb-8">
            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                style={{ width: `${(stepId / microtaskingSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {}
          <div className="prose prose-invert max-w-none">
            {}
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 mb-8 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <BookOpen className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <p className="text-lg text-[#e5e5e5] leading-relaxed m-0">
                  {step.content.introduction}
                </p>
              </div>
            </div>

            {}
            <div className="space-y-6">
              {step.content.mainContent.map((block, index) => {
                switch (block.type) {
                  case 'text':
                    return (
                      <div key={index} className="bg-neutral-900/50 rounded-lg p-6 border border-neutral-800">
                        {block.title && (
                          <h2 className="text-2xl font-heading font-bold text-white mb-3 mt-0">
                            {block.title}
                          </h2>
                        )}
                        <p className="text-[#e5e5e5] leading-relaxed whitespace-pre-wrap m-0">
                          {renderTextWithLinks(block.content as string)}
                        </p>
                      </div>
                    );

                  case 'list':
                    return (
                      <div key={index} className="bg-neutral-900/50 rounded-lg p-6 border border-neutral-800">
                        {block.title && (
                          <h3 className="text-xl font-heading font-bold text-white mb-4 mt-0">
                            {block.title}
                          </h3>
                        )}
                        <ul className="space-y-2 m-0 list-none p-0">
                          {(block.content as string[]).map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-[#e5e5e5]">
                              <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
                              <span className="leading-relaxed">{renderTextWithLinks(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );

                  case 'warning':
                    return (
                      <div key={index} className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg p-6 border border-red-500/30">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                          <div className="flex-grow">
                            <p className="text-[#e5e5e5] leading-relaxed m-0 whitespace-pre-wrap">
                              {renderTextWithLinks(block.content as string)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );

                  case 'tip':
                    return (
                      <div key={index} className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-6 border border-green-500/30">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                          <div className="flex-grow">
                            <p className="text-[#e5e5e5] leading-relaxed m-0 whitespace-pre-wrap">
                              {renderTextWithLinks(block.content as string)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );

                  case 'code':
                    return (
                      <div key={index} className="bg-neutral-950 rounded-lg p-4 border border-neutral-700 overflow-x-auto">
                        <pre className="text-sm text-green-400 font-mono m-0">
                          {block.content}
                        </pre>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>

            {}
            {step.content.keyTakeaways && step.content.keyTakeaways.length > 0 && (
              <div className="mt-8 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-500/30">
                <h3 className="text-xl font-heading font-bold text-white mb-4 flex items-center gap-2 mt-0">
                  <Check className="w-5 h-5 text-purple-400" />
                  Key Takeaways
                </h3>
                <ul className="space-y-2 m-0 list-none p-0">
                  {step.content.keyTakeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#e5e5e5]">
                      <span className="text-purple-400 mt-1 flex-shrink-0">✓</span>
                      <span className="leading-relaxed">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {}
          {error && (
            <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            {}
            {previousStep ? (
              <button
                onClick={() => router.push(`/microtasking/${previousStep.id}`)}
                className="w-full sm:w-auto group flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 
                         text-white rounded-lg transition-all duration-300 border border-neutral-700 hover:border-neutral-600"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <div className="text-left">
                  <div className="text-xs text-[#a3a3a3]">Previous</div>
                  <div className="font-semibold">{previousStep.shortTitle}</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => router.push('/microtasking')}
                className="w-full sm:w-auto group flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 
                         text-white rounded-lg transition-all duration-300 border border-neutral-700 hover:border-neutral-600"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Overview</span>
              </button>
            )}

            {}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
              {!isCompleted && (
                <MovingBorderButton
                  onClick={handleMarkComplete}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg 
                           transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Mark as Complete
                    </span>
                  )}
                </MovingBorderButton>
              )}

              {nextStep && (
                <button
                  onClick={() => router.push(`/microtasking/${nextStep.id}`)}
                  disabled={!isCompleted}
                  className="w-full sm:w-auto group flex items-center justify-between gap-2 px-6 py-3 
                           bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all duration-300 
                           disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500"
                >
                  <div className="text-right">
                    <div className="text-xs text-blue-200">Next</div>
                    <div className="font-semibold">{nextStep.shortTitle}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {!nextStep && isCompleted && (
                <button
                  onClick={() => router.push('/microtasking')}
                  className="w-full sm:w-auto group flex items-center gap-2 px-6 py-3 
                           bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all duration-300"
                >
                  <span>Return to Overview</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
