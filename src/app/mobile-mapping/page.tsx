"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingHeader } from "@/components/ui/floating-header";
import { CometCard } from "@/components/ui/comet-card";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";
import Link from "next/link";
import { mobileMappingSteps as defaultSteps, getMobileMappingSteps, formGuides, MobileMappingStep } from "@/data/mobile-mapping-training";
import { Clock, BookOpen, CheckCircle2, Smartphone, QrCode, Loader2, AlertCircle, FileText, ChevronDown, ChevronUp, HelpCircle, Lightbulb, Wifi, Upload, MessageCircleQuestion, Hand } from "lucide-react";
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
  const [qrLoading, setQrLoading] = useState(false);
  const [expandedForm, setExpandedForm] = useState<string | null>(null);
  const [mobileMappingSteps, setMobileMappingSteps] = useState<MobileMappingStep[]>(defaultSteps);
  const [settlement, setSettlement] = useState<string>("");
  
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
      
      // Fetch user profile to get settlement
      const profileResponse = await fetch('/api/youth/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const profileData = await profileResponse.json();
      if (profileData.success && profileData.data.settlement) {
        setSettlement(profileData.data.settlement);
        setMobileMappingSteps(getMobileMappingSteps(profileData.data.settlement));
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
              Mobile Mapping Training
            </h1>
            <p className="text-lg text-foreground-muted max-w-3xl mx-auto mb-4">
              {settlement ? `${settlement} Data Collection` : 'Data Collection'}
            </p>
            <div className="flex items-center justify-center gap-6 text-foreground-subtle">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{mobileMappingSteps.length} Steps</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>~{totalTime} min</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{completedSteps.size}/{mobileMappingSteps.length} Done</span>
              </div>
            </div>
          </div>

          {/* ========== ODK SETUP QR CODE - PROMINENT AT TOP ========== */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="bg-gradient-to-r from-primary/20 to-primary/5 border-2 border-primary/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-bold text-white flex items-center gap-3">
                  <div className="bg-primary/30 p-2 rounded-lg">
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                  Your ODK Setup Code
                </h2>
              </div>

              {odkLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="ml-2 text-foreground-muted">Loading your configuration...</span>
                </div>
              ) : odkConfig?.configured ? (
                <div>
                  <p className="text-sm text-foreground-muted mb-2">
                    Your personal QR code for ODK Collect setup:
                  </p>
                  <p className="text-primary font-semibold mb-4">
                    {odkConfig.displayName}
                  </p>

                  {!showQrCode ? (
                    <button
                      onClick={() => {
                        setQrLoading(true);
                        setShowQrCode(true);
                      }}
                      className="w-full bg-primary text-white py-4 px-6 rounded-xl hover:bg-primary-hover transition-colors font-semibold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                    >
                      <Hand className="w-5 h-5" />
                      Tap to Show QR Code
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center py-6 bg-white rounded-xl">
                        <QRCodeDisplay data={odkConfig.configUrl || ''} size={250} />
                      </div>
                      <div className="bg-background-elevated rounded-lg p-4 border border-border">
                        <p className="text-sm text-foreground-muted font-semibold mb-2 flex items-center gap-2"><Smartphone className="w-4 h-4" /> How to scan:</p>
                        <ol className="text-sm text-foreground-subtle space-y-1 list-decimal list-inside">
                          <li>Open ODK Collect on your phone</li>
                          <li>Tap menu (⋮) → Add project</li>
                          <li>Select "Configure with QR code"</li>
                          <li>Point camera at this QR code</li>
                        </ol>
                      </div>
                      <button
                        onClick={() => setShowQrCode(false)}
                        className="w-full text-foreground-subtle py-2 text-sm hover:text-foreground-muted"
                      >
                        Hide QR Code
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-3 py-4 bg-warning/10 rounded-lg px-4">
                  <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground-muted font-semibold">
                      ODK not configured yet
                    </p>
                    <p className="text-foreground-subtle text-sm mt-1">
                      {odkConfig?.message || 'Please contact your trainer to set up your ODK access.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-background-card border border-border rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground-subtle">Training Progress</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {mobileMappingSteps.map((step) => {
              const isCompleted = completedSteps.has(step.id);
              
              return (
                <CometCard key={step.id} rotateDepth={10} translateDepth={15}>
                  <Link href={`/mobile-mapping/${step.id}`}>
                    <div className="bg-background-elevated border border-border rounded-xl p-6 hover:border-primary/50 transition-all h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-success/20 border border-success/30' 
                              : 'bg-primary/10 border border-primary/30'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            ) : (
                              <span className="text-primary font-heading font-bold">{step.id}</span>
                            )}
                          </div>
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

          {/* ========== FORM GUIDES SECTION ========== */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-background-card border border-border rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-info/20 to-info/5 p-6 border-b border-border">
                <h2 className="text-xl font-heading font-bold text-white flex items-center gap-3">
                  <div className="bg-info/30 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-info" />
                  </div>
                  Form Guides
                </h2>
                <p className="text-foreground-muted mt-2">
                  Learn what each question means and how to answer correctly
                </p>
              </div>

              <div className="divide-y divide-border">
                {formGuides.map((form) => (
                  <div key={form.formId}>
                    <button
                      onClick={() => setExpandedForm(expandedForm === form.formId ? null : form.formId)}
                      className="w-full p-4 flex items-center justify-between hover:bg-background-elevated transition-colors"
                    >
                      <div className="text-left">
                        <h3 className="font-semibold text-white">{form.formName}</h3>
                        <p className="text-sm text-foreground-subtle">{form.description}</p>
                      </div>
                      {expandedForm === form.formId ? (
                        <ChevronUp className="w-5 h-5 text-foreground-subtle" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-foreground-subtle" />
                      )}
                    </button>

                    {expandedForm === form.formId && (
                      <div className="bg-background-elevated p-4 space-y-4">
                        {form.questions.map((q, idx) => (
                          <div key={idx} className="bg-background-card rounded-lg p-4 border border-border">
                            <div className="flex items-start gap-3">
                              <div className="bg-primary/20 p-1.5 rounded-lg flex-shrink-0">
                                <HelpCircle className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-white mb-1">{q.question}</h4>
                                <p className="text-sm text-foreground-muted mb-2">{q.explanation}</p>
                                
                                {q.examples && q.examples.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs text-foreground-subtle font-semibold mb-1">Examples:</p>
                                    <ul className="text-xs text-foreground-subtle space-y-0.5">
                                      {q.examples.map((ex, i) => (
                                        <li key={i}>• {ex}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {q.tip && (
                                  <div className="bg-success/10 border border-success/20 rounded-lg px-3 py-2 flex items-start gap-2">
                                    <Lightbulb className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-success">{q.tip}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {formGuides.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-foreground-subtle">No form guides available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-background-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-heading font-bold text-white mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Quick Reference
              </h3>
              <ul className="text-sm text-foreground-muted space-y-3">
                <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary flex-shrink-0" /> <span><strong>App:</strong> ODK Collect (free on Play Store)</span></li>
                <li className="flex items-center gap-2"><Wifi className="w-4 h-4 text-primary flex-shrink-0" /> <span><strong>Works Offline:</strong> Download forms first, then collect data anywhere</span></li>
                <li className="flex items-center gap-2"><Upload className="w-4 h-4 text-primary flex-shrink-0" /> <span><strong>Submit Daily:</strong> Send your forms when you have internet</span></li>
                <li className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary flex-shrink-0" /> <span><strong>Form Guides:</strong> Check above to understand questions</span></li>
                <li className="flex items-center gap-2"><MessageCircleQuestion className="w-4 h-4 text-primary flex-shrink-0" /> <span><strong>Need Help?</strong> Contact your supervisor</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
