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

// Get project URL based on youth ID prefix (settlement)
function getProjectUrlForYouth(youthId: string): string | null {
  if (!youthId) return null;
  
  const prefix = youthId.substring(0, 3).toUpperCase();
  
  if (prefix === 'KAR') {
    // Kariobangi Machakos
    return 'https://tasks.hotosm.org/projects/38022/';
  }
  
  if (prefix === 'HUR') {
    // Mji wa Huruma
    return 'https://tasks.hotosm.org/projects/38055/';
  }
  
  // Other settlements (KAY) - project not yet assigned
  return null;
}

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
  const [isStepLocked, setIsStepLocked] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [osmUsername, setOsmUsername] = useState('');
  const [savedOsmUsername, setSavedOsmUsername] = useState('');
  const [isEditingOsm, setIsEditingOsm] = useState(false);
  const [isSavingOsm, setIsSavingOsm] = useState(false);
  const [isVerifyingOsm, setIsVerifyingOsm] = useState(false);
  const [osmError, setOsmError] = useState('');
  const [osmSuccess, setOsmSuccess] = useState('');
  const [osmVerificationStatus, setOsmVerificationStatus] = useState<'none' | 'verified' | 'not-found' | 'error'>('none');
  const [youthId, setYouthId] = useState<string>('');
  
  const currentStepId = parseInt(stepId);
  const currentStep = getStepById(currentStepId);
  const nextStep = getNextStep(currentStepId);
  const previousStep = getPreviousStep(currentStepId);

  // Load completed steps from server and check if current step is locked
  useEffect(() => {
    const fetchProgress = async () => {
      const token = localStorage.getItem('youthToken');
      if (!token) {
        setIsLoadingProgress(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/youth/training-progress?module=mapper`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const completed = new Set<number>(response.data.data.progress.mapper);
          setCompletedSteps(completed);

          // Check if this step is locked (previous step not completed)
          if (currentStepId > 1 && !completed.has(currentStepId - 1)) {
            setIsStepLocked(true);
            // Auto-redirect to the last completed step + 1 or step 1
            const lastCompleted = Math.max(...Array.from(completed), 0);
            const nextAvailable = lastCompleted + 1;
            
            if (nextAvailable < currentStepId) {
              setTimeout(() => {
                router.push(`/digitization/mapper/${nextAvailable}`);
              }, 2000);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    fetchProgress();
  }, [currentStepId, router]);

  // Fetch OSM username and youth ID on component mount
  useEffect(() => {
    const fetchOsmUsername = async () => {
      const token = localStorage.getItem('youthToken');
      const youthData = localStorage.getItem('youthData');
      
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/api/youth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // Set youth ID for settlement-based content
          if (response.data.success && response.data.data.youthId) {
            setYouthId(response.data.data.youthId);
          }
          
          // Check for osmUsername (API returns camelCase)
          if (response.data.success && response.data.data.osmUsername) {
            const username = response.data.data.osmUsername;
            setSavedOsmUsername(username);
            setOsmUsername(username);
            setOsmVerificationStatus('verified');
            setIsEditingOsm(false); // Ensure we're not in edit mode
            
            // Update localStorage with OSM username
            if (youthData) {
              const youth = JSON.parse(youthData);
              youth.osmUsername = username;
              localStorage.setItem('youthData', JSON.stringify(youth));
            }
            
            console.log('✓ Loaded saved OSM username:', username);
          } else {
            console.log('No saved OSM username found');
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

  const verifyAndSaveOsmUsername = async () => {
    if (!osmUsername.trim()) {
      setOsmError('Please enter your OSM username');
      return;
    }

    setIsSavingOsm(true);
    setIsVerifyingOsm(true);
    setOsmError('');
    setOsmSuccess('');
    setOsmVerificationStatus('none');

    try {
      // Normalize username: trim whitespace
      // OSM displays usernames with spaces as %20 in URLs, but we'll store them with spaces
      const normalizedUsername = osmUsername.trim();
      
      console.log('Verifying OSM username:', normalizedUsername);
      
      // Step 1: Verify the username exists on OSM
      const verifyResponse = await axios.get(`${API_URL}/api/osm/verify-username?username=${encodeURIComponent(normalizedUsername)}`);
      
      console.log('Verification response:', verifyResponse.data);
      
      if (verifyResponse.data.success) {
        if (verifyResponse.data.exists === false) {
          // Username not found on OSM
          setOsmVerificationStatus('not-found');
          setOsmError(`⚠ This username was not found on OpenStreetMap. Please check the spelling (including capital letters) or create an account at openstreetmap.org first. Tried: "${normalizedUsername}"`);
          setIsSavingOsm(false);
          setIsVerifyingOsm(false);
          return;
        } else if (verifyResponse.data.exists === null) {
          // Couldn't verify (network issue)
          setOsmVerificationStatus('error');
          setOsmError('⚠ Unable to verify your username at this time. Please check your internet connection and try again.');
          setIsSavingOsm(false);
          setIsVerifyingOsm(false);
          return;
        }
        
        // Username verified! Proceed to save
        setOsmVerificationStatus('verified');
      }

      setIsVerifyingOsm(false);

      // Step 2: Save the verified username
      const token = localStorage.getItem('youthToken');
      if (!token) {
        setOsmError('Authentication required. Please login again.');
        setIsSavingOsm(false);
        return;
      }

      const saveResponse = await axios.put(
        `${API_URL}/api/youth/update-osm-username`,
        { osmUsername: normalizedUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (saveResponse.data.success) {
        const savedUsername = normalizedUsername;
        setSavedOsmUsername(savedUsername);
        setOsmUsername(savedUsername);
        setIsEditingOsm(false);
        setOsmVerificationStatus('verified');
        setOsmSuccess('✓ OSM username verified and saved successfully! You can now proceed to the next step.');
        
        // Update local storage
        const youthData = localStorage.getItem('youthData');
        if (youthData) {
          const youth = JSON.parse(youthData);
          youth.osmUsername = savedUsername;
          localStorage.setItem('youthData', JSON.stringify(youth));
        }
        
        // Scroll to success message
        setTimeout(() => {
          const successElement = document.querySelector('.bg-gradient-to-r');
          if (successElement) {
            successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        // Auto-dismiss success banner after 10 seconds
        setTimeout(() => {
          setOsmSuccess('');
        }, 10000);
      }
    } catch (error: any) {
      setOsmError(error.response?.data?.message || 'Failed to save OSM username. Please try again.');
      setOsmVerificationStatus('error');
    } finally {
      setIsSavingOsm(false);
      setIsVerifyingOsm(false);
    }
  };

  const markStepComplete = async () => {
    // For step 2, require OSM username before proceeding
    if (currentStepId === 2 && !savedOsmUsername) {
      setOsmError('⚠ You must save your verified OSM username before completing this step.');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    try {
      const token = localStorage.getItem('youthToken');
      if (!token) {
        alert('Authentication required. Please login again.');
        router.push('/');
        return;
      }

      // Mark step complete in database
      const response = await axios.post(
        `${API_URL}/api/youth/training-progress`,
        { moduleType: 'mapper', stepId: currentStepId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const newCompleted = new Set(completedSteps);
        newCompleted.add(currentStepId);
        setCompletedSteps(newCompleted);
        
        // Auto-navigate to next step
        if (nextStep) {
          setTimeout(() => {
            router.push(`/digitization/mapper/${nextStep.id}`);
          }, 500);
        } else {
          // All steps completed
          setTimeout(() => {
            router.push('/digitization');
          }, 1000);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert(error.response.data.message || 'You must complete previous steps first.');
        if (error.response.data.missingStep) {
          router.push(`/digitization/mapper/${error.response.data.missingStep}`);
        }
      } else {
        console.error('Error marking step complete:', error);
        alert('Failed to save progress. Please try again.');
      }
    }
  };

  if (!currentStep) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Step not found</div>;
  }

  // Show locked state if step is not accessible
  if (isLoadingProgress) {
    return (
      <main className="min-h-screen bg-black relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <FloatingHeader showBackButton backHref="/digitization" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#dc2626] mx-auto mb-4"></div>
            <p className="text-[#e5e5e5]">Loading training progress...</p>
          </div>
        </div>
      </main>
    );
  }

  if (isStepLocked) {
    const lastCompleted = Math.max(...Array.from(completedSteps), 0);
    const requiredStep = currentStepId - 1;

    return (
      <main className="min-h-screen bg-black relative overflow-hidden">
        <BackgroundBeams className="opacity-30" />
        <FloatingHeader showBackButton backHref="/digitization" />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full bg-[#0a0a0a] border border-[#dc2626]/30 rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#dc2626]/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-[#dc2626]" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-3">Step Locked</h2>
            <p className="text-[#e5e5e5] mb-6">
              You must complete <span className="text-[#dc2626] font-semibold">Step {requiredStep}</span> before accessing this step. 
              Training steps must be completed in order to ensure proper learning.
            </p>
            <div className="space-y-3">
              <MovingBorderButton
                onClick={() => router.push(`/digitization/mapper/${lastCompleted + 1}`)}
                className="w-full"
              >
                Go to Next Available Step
              </MovingBorderButton>
              <button
                onClick={() => router.push('/digitization')}
                className="w-full px-4 py-3 bg-[#262626] hover:bg-[#404040] text-white rounded-lg transition-colors"
              >
                Back to Training Overview
              </button>
            </div>
          </div>
        </div>
      </main>
    );
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

                {block.type === 'dynamic-project' && (
                  <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 sm:p-6">
                    {block.title && (
                      <h3 className="text-lg sm:text-xl font-subheading font-bold text-white mb-3 sm:mb-4">
                        {block.title}
                      </h3>
                    )}
                    {(() => {
                      const projectUrl = getProjectUrlForYouth(youthId);
                      
                      if (projectUrl) {
                        // Show project link for assigned settlements
                        return (
                          <ul className="space-y-2 sm:space-y-3">
                            <li className="flex items-start gap-2 sm:gap-3 text-[#e5e5e5] text-sm sm:text-base">
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                              <span className="break-words">
                                Visit the project page: <a
                                  href={projectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 break-all"
                                >
                                  <span className="break-all">{projectUrl}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              </span>
                            </li>
                            <li className="flex items-start gap-2 sm:gap-3 text-[#e5e5e5] text-sm sm:text-base">
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                              <span className="break-words">Click the link above to open the project in a new tab</span>
                            </li>
                            <li className="flex items-start gap-2 sm:gap-3 text-[#e5e5e5] text-sm sm:text-base">
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                              <span className="break-words">Review the project instructions carefully</span>
                            </li>
                            <li className="flex items-start gap-2 sm:gap-3 text-[#e5e5e5] text-sm sm:text-base">
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                              <span className="break-words">Familiarize yourself with the mapping area</span>
                            </li>
                            <li className="flex items-start gap-2 sm:gap-3 text-[#e5e5e5] text-sm sm:text-base">
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                              <span className="break-words">Note the specific features you'll be mapping (buildings, roads, etc.)</span>
                            </li>
                            <li className="flex items-start gap-2 sm:gap-3 text-[#e5e5e5] text-sm sm:text-base">
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                              <span className="break-words">Bookmark this project page for easy access during your mapping sessions</span>
                            </li>
                          </ul>
                        );
                      } else {
                        // Show coming soon message for settlements without assigned projects
                        return (
                          <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Clock className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[#f59e0b] font-semibold mb-2">Project Assignment Coming Soon</p>
                                <p className="text-[#e5e5e5] text-sm">
                                  Your settlement-specific HOT Tasking Manager project is currently being prepared. 
                                  You will be notified once your project has been assigned and you can begin mapping. 
                                  Please check back later or contact your training coordinator for updates.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })()}
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
                    {savedOsmUsername && !isEditingOsm && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-[#22c55e]/20 text-[#22c55e] text-xs rounded-full">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                  </h3>
                  <p className="text-[#e5e5e5] text-sm">
                    {savedOsmUsername && !isEditingOsm
                      ? '✓ Your OSM username has been verified and saved. You can now proceed to complete this step.'
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
                          <p className="text-sm text-[#a3a3a3] mb-1">✓ Saved OSM Username</p>
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
                  
                  {/* Helpful reminder */}
                  <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg p-3">
                    <p className="text-sm text-[#e5e5e5]">
                      <strong>Ready to continue?</strong> Scroll down and click <strong className="text-[#22c55e]">"Mark as Complete"</strong> to proceed to the next step.
                    </p>
                  </div>
                </div>
              ) : (
                // Show input form
                <div className="space-y-4">
                  <div>
                    <label htmlFor="osmUsername" className="block text-sm font-medium text-[#e5e5e5] mb-2">
                      OpenStreetMap Username
                    </label>
                    
                    {/* Helpful notice about usernames */}
                    <div className="mb-3 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg p-3">
                      <p className="text-sm font-semibold text-[#3b82f6] mb-2">💡 Important Tips</p>
                      <ul className="text-xs text-[#e5e5e5] space-y-2">
                        <li>
                          <strong>Spaces are OK:</strong> If your OSM username has spaces (e.g., "Jeremiah james"), you can enter it exactly as it appears. We'll handle it automatically!
                        </li>
                        <li>
                          <strong>Case matters:</strong> Enter your username with the exact capitalization (e.g., "Jeremiah james" not "Jeremiah James").
                        </li>
                        <li className="text-[#a3a3a3]">
                          On OpenStreetMap URLs, spaces appear as "%20" but you should type the actual space.
                        </li>
                      </ul>
                    </div>
                    
                    {/* Instructions on how to find OSM username */}
                    <div className="mb-3 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg p-3">
                      <p className="text-xs text-[#e5e5e5] mb-2">
                        <strong>How to find your OSM username:</strong>
                      </p>
                      <ol className="text-xs text-[#a3a3a3] space-y-1 list-decimal list-inside">
                        <li>Go to <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">openstreetmap.org</a> and login</li>
                        <li>Click on your profile icon (top right corner)</li>
                        <li>Click "My Profile"</li>
                        <li>Your username is the <strong className="text-white">last part of the URL</strong> in your browser</li>
                        <li>Example: openstreetmap.org/user/<strong className="text-[#22c55e]">YourUsername</strong></li>
                      </ol>
                    </div>
                    
                    <input
                      type="text"
                      id="osmUsername"
                      value={osmUsername}
                      onChange={(e) => {
                        setOsmUsername(e.target.value);
                        setOsmVerificationStatus('none');
                        setOsmError('');
                        setOsmSuccess('');
                      }}
                      placeholder="Enter your OSM username exactly as shown in the URL"
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white placeholder-[#a3a3a3] focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSavingOsm || isVerifyingOsm}
                    />
                    <p className="mt-2 text-xs text-[#a3a3a3]">
                      We'll verify this username exists on OpenStreetMap before saving
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
                      <p className="text-sm text-yellow-400">⚠ Unable to verify at this time. Please check your connection and try again.</p>
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
                      onClick={verifyAndSaveOsmUsername}
                      disabled={isSavingOsm || isVerifyingOsm || !osmUsername.trim()}
                      className="flex-1 px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#262626] disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {isSavingOsm || isVerifyingOsm ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {isVerifyingOsm && !isSavingOsm ? 'Verifying...' : 'Saving...'}
                        </span>
                      ) : (
                        savedOsmUsername ? 'Verify & Update' : 'Verify & Submit'
                      )}
                    </button>
                    
                    {savedOsmUsername && isEditingOsm && (
                      <button
                        onClick={() => {
                          setIsEditingOsm(false);
                          setOsmUsername(savedOsmUsername);
                          setOsmError('');
                          setOsmSuccess('');
                          setOsmVerificationStatus('none');
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
              disabled={currentStepId === 2 && !savedOsmUsername}
              className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                completedSteps.has(currentStepId)
                  ? 'bg-[#22c55e] text-white'
                  : (currentStepId === 2 && !savedOsmUsername)
                  ? 'bg-[#262626] text-[#737373] cursor-not-allowed'
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
              <button
                onClick={() => {
                  if (completedSteps.has(currentStepId)) {
                    router.push(`/digitization/mapper/${nextStep.id}`);
                  } else {
                    alert('Please complete this step before proceeding to the next one.');
                  }
                }}
                disabled={!completedSteps.has(currentStepId)}
                className={`w-full sm:flex-1 sm:max-w-[180px] px-4 py-3 rounded-lg font-medium transition-all ${
                  completedSteps.has(currentStepId)
                    ? 'bg-gradient-to-r from-[#dc2626] to-[#ef4444] text-white hover:opacity-90'
                    : 'bg-[#262626] text-[#737373] cursor-not-allowed'
                } flex items-center justify-center gap-2`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (completedSteps.has(currentStepId)) {
                    router.push('/digitization');
                  } else {
                    alert('Please complete this step to finish the mapper training.');
                  }
                }}
                disabled={!completedSteps.has(currentStepId)}
                className={`w-full sm:flex-1 sm:max-w-[180px] px-4 py-3 rounded-lg font-medium transition-all ${
                  completedSteps.has(currentStepId)
                    ? 'bg-gradient-to-r from-[#dc2626] to-[#ef4444] text-white hover:opacity-90'
                    : 'bg-[#262626] text-[#737373] cursor-not-allowed'
                } flex items-center justify-center gap-2`}
              >
                <span>Finish</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
