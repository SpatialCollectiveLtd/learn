"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { CometCard } from "@/components/ui/comet-card";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";
import Link from "next/link";
import { mobileMappingSteps } from "@/data/mobile-mapping-training";
import { Clock, BookOpen, CheckCircle2, Smartphone, QrCode, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface OdkConfig {
  configured: boolean;
  displayName?: string;
  configUrl?: string;
  instructions?: string[];
  message?: string;
}

export default function MobileMappingOverviewPage() {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [odkConfig, setOdkConfig] = useState<OdkConfig | null>(null);
  const [odkLoading, setOdkLoading] = useState(true);
  const [showQrCode, setShowQrCode] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('mobile-mapping-completed-steps');
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }
    
    // Fetch ODK configuration
    fetchOdkConfig();
  }, []);

  const fetchOdkConfig = async () => {
    try {
      const token = localStorage.getItem('youthToken');
      if (!token) return;

      const response = await fetch('/api/youth/odk-config', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setOdkConfig(data.data);
      }
    } catch (error) {
      console.error('Error fetching ODK config:', error);
    } finally {
      setOdkLoading(false);
    }
  };

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

          {/* ODK Setup QR Code Section */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-background-card border border-primary/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  Setup ODK Collect
                </h3>
                {odkConfig?.configured && (
                  <button
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="text-sm bg-primary/20 border border-primary/30 text-primary px-4 py-2 rounded-lg hover:bg-primary/30 transition-colors"
                  >
                    {showQrCode ? 'Hide QR Code' : 'Show QR Code'}
                  </button>
                )}
              </div>

              {odkLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="ml-2 text-foreground-muted">Loading configuration...</span>
                </div>
              ) : odkConfig?.configured ? (
                <>
                  <p className="text-sm text-foreground-muted mb-4">
                    Scan this QR code with ODK Collect to connect to the data collection server.
                    <br />
                    <span className="text-foreground-subtle">Account: {odkConfig.displayName}</span>
                  </p>

                  {showQrCode && odkConfig.configUrl && (
                    <div className="flex flex-col items-center py-6 bg-background-elevated rounded-lg border border-border">
                      <QRCodeDisplay data={odkConfig.configUrl} size={220} />
                      <p className="mt-4 text-xs text-foreground-subtle text-center max-w-xs">
                        Open ODK Collect → Menu → Add Project → Scan QR Code
                      </p>
                    </div>
                  )}

                  {odkConfig.instructions && !showQrCode && (
                    <ol className="text-sm text-foreground-muted space-y-2 list-decimal list-inside">
                      {odkConfig.instructions.map((instruction, idx) => (
                        <li key={idx}>{instruction}</li>
                      ))}
                    </ol>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-3 py-4">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground-muted text-sm">
                      {odkConfig?.message || 'ODK has not been configured for your account yet.'}
                    </p>
                    <p className="text-foreground-subtle text-xs mt-1">
                      Please contact your trainer to set up your ODK access.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
