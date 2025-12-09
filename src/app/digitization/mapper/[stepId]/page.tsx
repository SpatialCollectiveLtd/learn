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
  User,
  ExternalLink
} from "lucide-react";
import { mapperTrainingSteps, getStepById, getNextStep, getPreviousStep } from "@/data/mapper-training";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Function to make URLs clickable
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

export default function MapperTrainingStepPage({
  params,
}: {
  params: Promise<{ stepId: string }>;
}) {
  const { stepId } = use(params);
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [osmUsername, setOsmUsername] = useState('');
  const [savedOsmUsername, setSavedOsmUsername] = useState('');
  const [isEditingOsm, setIsEditingOsm] = useState(false);
  const [isSavingOsm, setIsSavingOsm] = useState(false);
  const [isVerifyingOsm, setIsVerifyingOsm] = useState(false);
  const [osmError, setOsmError] = useState('');
  const [osmSuccess, setOsmSuccess] = useState('');
  const [osmVerificationStatus, setOsmVerificationStatus] = useState<'none' | 'verified' | 'not-found' | 'error'>('none');
  
  const currentStepId = parseInt(stepId);
  const currentStep = getStepById(currentStepId);
  const nextStep = getNextStep(currentStepId);
  const previousStep = getPreviousStep(currentStepId);

  // Load completed steps and OSM username from localStorage/server
  useEffect(() => {
    const saved = localStorage.getItem('mapper-completed-steps');
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }

    // Fetch youth data to check for OSM username
    const fetchOsmUsername = async () => {
      const token = localStorage.getItem('youthToken');
      const youthData = localStorage.getItem('youthData');
      
      if (token && youthData) {
        try {
          const youth = JSON.parse(youthData);
          const response = await axios.get(`${API_URL}/api/youth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (response.data.success && response.data.data.osm_username) {
            setSavedOsmUsername(response.data.data.osm_username);
            setOsmUsername(response.data.data.osm_username);
          }
        } catch (error) {
          console.error('Error fetching OSM username:', error);
        }
      }
    };

    fetchOsmUsername();
  }, []);

  const verifyOsmUsername = async (username: string) => {
    if (!username.trim()) return;

    setIsVerifyingOsm(true);
    setOsmVerificationStatus('none');

    try {
      const response = await axios.get(`${API_URL}/api/osm/verify-username?username=${encodeURIComponent(username.trim())}`);
      
      if (response.data.success) {
        if (response.data.exists === true) {
          setOsmVerificationStatus('verified');
        } else if (response.data.exists === false) {
          setOsmVerificationStatus('not-found');
        } else {
          setOsmVerificationStatus('error');
        }
      }
    } catch (error) {
      console.error('Error verifying OSM username:', error);
      setOsmVerificationStatus('error');
    } finally {
      setIsVerifyingOsm(false);
    }
  };

  const saveOsmUsername = async () => {
    if (!osmUsername.trim()) {
      setOsmError('Please enter your OSM username');
      return;
    }

    setIsSavingOsm(true);
    setOsmError('');
    setOsmSuccess('');

    try {
      const token = localStorage.getItem('youthToken');
      if (!token) {
        setOsmError('Authentication required. Please login again.');
        return;
      }

      const response = await axios.put(
        `${API_URL}/api/youth/update-osm-username`,
        { osmUsername: osmUsername.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSavedOsmUsername(osmUsername.trim());
        setIsEditingOsm(false);
        setOsmSuccess('OSM username saved successfully! You can now proceed to the next step.');
        
        // Update local storage
        const youthData = localStorage.getItem('youthData');
        if (youthData) {
          const youth = JSON.parse(youthData);
          youth.osmUsername = osmUsername.trim();
          localStorage.setItem('youthData', JSON.stringify(youth));
        }
      }
    } catch (error: any) {
      setOsmError(error.response?.data?.message || 'Failed to save OSM username. Please try again.');
    } finally {
      setIsSavingOsm(false);
    }
  };

  const markStepComplete = () => {
    // For step 2, require OSM username before proceeding
    if (currentStepId === 2 && !savedOsmUsername) {
      setOsmError('You must save your OSM username before proceeding to the next step.');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

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
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[#a3a3a3] text-xs sm:text-sm">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Step {currentStepId} of {mapperTrainingSteps.length}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[#a3a3a3] text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{currentStep.estimatedTime} min</span>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-heading font-bold text-white mb-3 sm:mb-4 leading-tight">
              {currentStep.title}
            </h1>
            
            <p className="text-base sm:text-lg text-[#e5e5e5] leading-relaxed">
              {currentStep.content.introduction}
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-6 sm:space-y-8 mb-12">
            {currentStep.content.mainContent.map((block, index) => (
              <div key={index}>
                {block.type === 'text' && (
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 sm:p-6">
                    {block.title && (
                      <h3 className="text-lg sm:text-xl font-subheading font-bold text-white mb-3 sm:mb-4">
                        {block.title}
                      </h3>
                    )}
                    <p className="text-[#e5e5e5] leading-relaxed text-sm sm:text-base break-words">{renderTextWithLinks(block.content as string)}</p>
                  </div>
                )}

                {block.type === 'list' && (
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 sm:p-6">
                    {block.title && (
                      <h3 className="text-lg sm:text-xl font-subheading font-bold text-white mb-3 sm:mb-4">
                        {block.title}
                      </h3>
                    )}
                    <ul className="space-y-2 sm:space-y-3">
                      {(block.content as string[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 sm:gap-3 text-[#e5e5e5] text-sm sm:text-base">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                          <span className="break-words">{renderTextWithLinks(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {block.type === 'warning' && (
                  <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-[#dc2626] flex-shrink-0" />
                      <p className="text-[#e5e5e5] leading-relaxed text-sm sm:text-base break-words">{renderTextWithLinks(block.content as string)}</p>
                    </div>
                  </div>
                )}

                {block.type === 'tip' && (
                  <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-[#3b82f6] flex-shrink-0" />
                      <p className="text-[#e5e5e5] leading-relaxed text-sm sm:text-base break-words">{renderTextWithLinks(block.content as string)}</p>
                    </div>
                  </div>
                )}

                {block.type === 'image' && (
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-3 sm:p-4 overflow-hidden">
                    {block.title && (
                      <h3 className="text-base sm:text-lg font-subheading font-semibold text-white mb-2 sm:mb-3 px-1 sm:px-2">
                        {block.title}
                      </h3>
                    )}
                    <div className="relative w-full rounded-lg overflow-hidden border border-[#262626]">
                      <img 
                        src={block.content as string}
                        alt={block.imageAlt || 'Training screenshot'}
                        className="w-full h-auto object-contain bg-[#000000]"
                        loading="lazy"
                      />
                    </div>
                    {block.imageAlt && (
                      <p className="text-xs sm:text-sm text-[#737373] mt-2 px-1 sm:px-2 italic">{block.imageAlt}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* OSM Username Form - Only show on Step 2 */}
          {currentStepId === 2 && (
            <div className="bg-gradient-to-r from-[#3b82f6]/10 to-[#3b82f6]/5 border border-[#3b82f6]/30 rounded-xl p-6 mb-12">
              <div className="flex items-start gap-4 mb-4">
                <User className="w-6 h-6 text-[#3b82f6] flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-subheading font-bold text-white mb-2">
                    OpenStreetMap Username
                  </h3>
                  <p className="text-[#e5e5e5] text-sm">
                    {savedOsmUsername && !isEditingOsm
                      ? 'Your OSM username has been saved. You can change it if needed.'
                      : 'Enter the OSM username you created above. This is required to continue to the next training step.'}
                  </p>
                </div>
              </div>

              {savedOsmUsername && !isEditingOsm ? (
                // Show saved username with edit option
                <div className="space-y-4">
                  <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-[#22c55e]" />
                        </div>
                        <div>
                          <p className="text-sm text-[#a3a3a3] mb-1">Saved OSM Username</p>
                          <p className="text-lg font-semibold text-white">{savedOsmUsername}</p>
                          <a 
                            href={`https://www.openstreetmap.org/user/${encodeURIComponent(savedOsmUsername)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#3b82f6] hover:text-[#2563eb] inline-flex items-center gap-1 mt-1"
                          >
                            View OSM Profile →
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsEditingOsm(true);
                          setOsmError('');
                          setOsmSuccess('');
                        }}
                        className="px-4 py-2 bg-[#262626] hover:bg-[#404040] text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Change Username
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Show input form
                <div className="space-y-4">
                  <div>
                    <label htmlFor="osmUsername" className="block text-sm font-medium text-[#e5e5e5] mb-2">
                      OpenStreetMap Username
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="osmUsername"
                        value={osmUsername}
                        onChange={(e) => {
                          setOsmUsername(e.target.value);
                          setOsmVerificationStatus('none');
                        }}
                        onBlur={() => verifyOsmUsername(osmUsername)}
                        placeholder="Enter your OSM display name"
                        className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white placeholder-[#a3a3a3] focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSavingOsm || isVerifyingOsm}
                      />
                      <button
                        onClick={() => verifyOsmUsername(osmUsername)}
                        disabled={!osmUsername.trim() || isVerifyingOsm || isSavingOsm}
                        className="px-4 py-3 bg-[#262626] hover:bg-[#404040] disabled:bg-[#1a1a1a] disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                      >
                        {isVerifyingOsm ? 'Checking...' : 'Verify'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[#a3a3a3]">
                      We'll verify if this username exists on OpenStreetMap
                    </p>
                  </div>

                  {/* Verification Status */}
                  {osmVerificationStatus === 'verified' && (
                    <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#22c55e]" />
                        <p className="text-sm text-green-400">✓ OSM account verified! This username exists on OpenStreetMap.</p>
                      </div>
                    </div>
                  )}

                  {osmVerificationStatus === 'not-found' && (
                    <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-400 mb-1">⚠ Username not found on OpenStreetMap</p>
                          <p className="text-xs text-[#a3a3a3]">Please check the spelling or create an account at openstreetmap.org</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {osmVerificationStatus === 'error' && (
                    <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-lg p-3">
                      <p className="text-sm text-yellow-400">⚠ Unable to verify at this time. You can still save your username.</p>
                    </div>
                  )}

                  {osmError && (
                    <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-lg p-3">
                      <p className="text-sm text-red-400">{osmError}</p>
                    </div>
                  )}

                  {osmSuccess && (
                    <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#22c55e]" />
                        <p className="text-sm text-green-400">{osmSuccess}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={saveOsmUsername}
                      disabled={isSavingOsm || !osmUsername.trim()}
                      className="flex-1 px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#262626] disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {isSavingOsm ? 'Saving...' : savedOsmUsername ? 'Update OSM Username' : 'Save OSM Username'}
                    </button>
                    
                    {savedOsmUsername && isEditingOsm && (
                      <button
                        onClick={() => {
                          setIsEditingOsm(false);
                          setOsmUsername(savedOsmUsername);
                          setOsmError('');
                          setOsmSuccess('');
                        }}
                        className="px-6 py-3 bg-[#262626] hover:bg-[#404040] text-white rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key Takeaways */}
          {currentStep.content.keyTakeaways && (
            <div className="bg-gradient-to-r from-[#dc2626]/10 to-[#dc2626]/5 border border-[#dc2626]/20 rounded-xl p-4 sm:p-6 mb-12">
              <h3 className="text-lg sm:text-xl font-subheading font-bold text-white mb-3 sm:mb-4">
                Key Takeaways
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {currentStep.content.keyTakeaways.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3 text-[#e5e5e5] text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                    <span className="break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            {previousStep ? (
              <MovingBorderButton
                onClick={() => router.push(`/digitization/mapper/${previousStep.id}`)}
                className="w-full sm:flex-1 sm:max-w-[180px]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </MovingBorderButton>
            ) : (
              <div className="hidden sm:block sm:flex-1 sm:max-w-[180px]" />
            )}

            <button
              onClick={markStepComplete}
              className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                completedSteps.has(currentStepId)
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-[#dc2626] text-white hover:bg-[#ef4444]'
              }`}
            >
              {completedSteps.has(currentStepId) ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Completed</span>
                </span>
              ) : (
                'Mark Complete'
              )}
            </button>

            {nextStep ? (
              <MovingBorderButton
                onClick={() => router.push(`/digitization/mapper/${nextStep.id}`)}
                className="w-full sm:flex-1 sm:max-w-[180px]"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </MovingBorderButton>
            ) : (
              <MovingBorderButton
                onClick={() => router.push('/digitization')}
                className="w-full sm:flex-1 sm:max-w-[180px]"
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
