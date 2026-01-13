"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { CometCard } from "@/components/ui/comet-card";
import Link from "next/link";
import { mobileMappingSteps } from "@/data/mobile-mapping-training";
import { Clock, BookOpen, CheckCircle2, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

export default function MobileMappingOverviewPage() {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    const saved = localStorage.getItem('mobile-mapping-completed-steps');
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }
  }, []);

  const totalTime = mobileMappingSteps.reduce((sum, step) => sum + step.estimatedTime, 0);

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />
      
      <FloatingHeader showBackButton backHref="/dashboard" />
      
      <div className="relative z-10 pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
              Mobile Mapping Training
            </h1>
            <p className="text-lg text-foreground-muted max-w-3xl mx-auto mb-6">
              Learn how to collect field data using ODK Collect on your smartphone. Simple, quick training to get you started!
            </p>
            <div className="flex items-center justify-center gap-6 text-foreground-subtle">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{mobileMappingSteps.length} Steps</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>~{totalTime} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{completedSteps.size}/{mobileMappingSteps.length} Completed</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="bg-background-card border border-border rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground-subtle">Your Progress</span>
                <span className="text-primary font-semibold">
                  {Math.round((completedSteps.size / mobileMappingSteps.length) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-background-elevated rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500"
                  style={{ width: `${(completedSteps.size / mobileMappingSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Training Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {mobileMappingSteps.map((step) => {
              const isCompleted = completedSteps.has(step.id);
              
              return (
                <CometCard key={step.id} rotateDepth={10} translateDepth={15}>
                  <Link href={`/mobile-mapping/${step.id}`}>
                    <div className="bg-background-elevated border border-border rounded-xl p-6 hover:border-primary/50 transition-all h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <span className="text-primary font-heading font-bold">{step.id}</span>
                          </div>
                          {isCompleted && (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-foreground-subtle text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{step.estimatedTime}m</span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-heading font-bold text-white mb-2">
                        {step.title}
                      </h3>
                      
                      <p className="text-sm text-foreground-subtle line-clamp-2">
                        {step.content.introduction}
                      </p>
                      
                      <div className="mt-4 pt-4 border-t border-border">
                        <span className="text-primary text-sm font-subheading font-semibold">
                          {isCompleted ? 'Review →' : 'Start →'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </CometCard>
              );
            })}
          </div>

          {/* Quick Help Section */}
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-info/10 border border-info/30 rounded-xl p-6">
              <h3 className="text-lg font-heading font-bold text-white mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-info" />
                Quick Reference
              </h3>
              <ul className="text-sm text-foreground-muted space-y-2">
                <li>📱 <strong>App:</strong> ODK Collect (free on Play Store)</li>
                <li>🌐 <strong>Works Offline:</strong> Download forms first, then collect data anywhere</li>
                <li>📤 <strong>Submit Daily:</strong> Send your forms when you have internet</li>
                <li>❓ <strong>Need Help?</strong> Contact your supervisor</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
