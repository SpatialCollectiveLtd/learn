"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { CometCard } from "@/components/ui/comet-card";
import Link from "next/link";
import { mapperTrainingSteps } from "@/data/mapper-training";
import { Clock, BookOpen, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function MapperOverviewPage() {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    const saved = localStorage.getItem('mapper-completed-steps');
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }
  }, []);

  const totalTime = mapperTrainingSteps.reduce((sum, step) => sum + step.estimatedTime, 0);

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />
      
      <FloatingHeader showBackButton backHref="/digitization" />
      
      <div className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
              Mapper Training
            </h1>
            <p className="text-lg text-[#e5e5e5] max-w-3xl mx-auto mb-6">
              Complete professional training in digital mapping, JOSM, and the HOT Tasking Manager workflow.
            </p>
            <div className="flex items-center justify-center gap-6 text-[#a3a3a3]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{mapperTrainingSteps.length} Steps</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>~{totalTime} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{completedSteps.size}/{mapperTrainingSteps.length} Completed</span>
              </div>
            </div>
          </div>

          {/* Training Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mapperTrainingSteps.map((step) => {
              const isCompleted = completedSteps.has(step.id);
              
              return (
                <CometCard key={step.id} rotateDepth={10} translateDepth={15}>
                  <Link href={`/digitization/mapper/${step.id}`}>
                    <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 hover:border-[#dc2626]/50 transition-all h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#dc2626]/10 border border-[#dc2626]/30 flex items-center justify-center">
                            <span className="text-[#dc2626] font-heading font-bold">{step.id}</span>
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
    </main>
  );
}
