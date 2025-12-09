"use client";

import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, Clock, ExternalLink } from "lucide-react";
import { mapperTrainingSteps } from "@/data/mapper-training";
import { validatorTrainingSteps } from "@/data/validator-training";

export default function TrainingMaterialsPage() {
  const router = useRouter();
  const [staffData, setStaffData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    const staff = localStorage.getItem('staffData');

    if (!token || !staff) {
      router.push('/');
      return;
    }

    const staffInfo = JSON.parse(staff);
    if (staffInfo.role !== 'trainer') {
      router.push('/dashboard/staff');
      return;
    }

    setStaffData(staffInfo);
    setIsLoading(false);
  }, [router]);

  const totalMapperTime = mapperTrainingSteps.reduce((sum, step) => sum + step.estimatedTime, 0);
  const totalValidatorTime = validatorTrainingSteps.reduce((sum, step) => sum + step.estimatedTime, 0);
  const totalSteps = mapperTrainingSteps.length + validatorTrainingSteps.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]"></div>
          <p className="mt-4 text-[#e5e5e5]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />

      <div className="relative z-10">
        <header className="bg-[#1F2121]/80 backdrop-blur-sm border-b border-[#2a2a2a]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link 
                  href="/dashboard/trainer"
                  className="text-[#dc2626] hover:text-[#b91c1c] transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                  <h1 className="text-lg font-heading font-bold text-white">
                    Training Materials
                  </h1>
                  <p className="text-xs text-[#a3a3a3]">Access training content and resources</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{staffData?.fullName}</p>
                <p className="text-xs text-[#a3a3a3]">Trainer</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <BookOpen className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">{totalSteps}</p>
              <p className="text-sm text-[#a3a3a3]">Total Training Steps</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <FileText className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">2</p>
              <p className="text-sm text-[#a3a3a3]">Training Modules</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <Clock className="w-8 h-8 text-purple-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">{Math.round((totalMapperTime + totalValidatorTime) / 60)}h</p>
              <p className="text-sm text-[#a3a3a3]">Total Duration</p>
            </div>
          </div>

          {/* Mapper Training Module */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-[#3b82f6]/10 to-[#3b82f6]/5 border border-[#3b82f6]/30 rounded-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-heading font-bold text-white">
                  Digitization - Mapper Training
                </h2>
                <Link
                  href="/digitization/mapper"
                  className="text-sm text-[#3b82f6] hover:text-[#2563eb] font-medium inline-flex items-center gap-1"
                >
                  View Module <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-[#e5e5e5] text-sm mb-3">
                Complete guide to OpenStreetMap mapping for youth participants
              </p>
              <div className="flex gap-4 text-sm text-[#a3a3a3]">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {mapperTrainingSteps.length} Steps
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  ~{totalMapperTime} minutes
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mapperTrainingSteps.map((step) => (
                <Link
                  key={step.id}
                  href={`/digitization/mapper/${step.id}`}
                  className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] hover:border-[#3b82f6]/50 rounded-lg p-5 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] font-bold">
                        {step.id}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#3b82f6] transition-colors">
                          {step.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-[#737373]" />
                          <span className="text-xs text-[#737373]">{step.estimatedTime} min</span>
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#737373] group-hover:text-[#3b82f6] transition-colors" />
                  </div>
                  <p className="text-sm text-[#a3a3a3] line-clamp-2">
                    {step.content.introduction}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Validator Training Module */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-[#22c55e]/10 to-[#22c55e]/5 border border-[#22c55e]/30 rounded-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-heading font-bold text-white">
                  Digitization - Validator Training
                </h2>
                <Link
                  href="/digitization/validator"
                  className="text-sm text-[#22c55e] hover:text-[#16a34a] font-medium inline-flex items-center gap-1"
                >
                  View Module <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-[#e5e5e5] text-sm mb-3">
                Advanced training for staff validators - Quality assurance and validation
              </p>
              <div className="flex gap-4 text-sm text-[#a3a3a3]">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {validatorTrainingSteps.length} Steps
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  ~{totalValidatorTime} minutes
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {validatorTrainingSteps.map((step) => (
                <Link
                  key={step.id}
                  href={`/digitization/validator/${step.id.replace('validator-', '')}`}
                  className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] hover:border-[#22c55e]/50 rounded-lg p-5 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] font-bold">
                        {step.id.replace('validator-', '')}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#22c55e] transition-colors">
                          {step.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-[#737373]" />
                          <span className="text-xs text-[#737373]">{step.estimatedTime} min</span>
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#737373] group-hover:text-[#22c55e] transition-colors" />
                  </div>
                  <p className="text-sm text-[#a3a3a3] line-clamp-2">
                    {step.content.introduction}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-r from-[#dc2626]/10 to-[#dc2626]/5 border border-[#dc2626]/30 rounded-lg p-6">
            <h3 className="text-xl font-heading font-bold text-white mb-2">
              Trainer Resources
            </h3>
            <p className="text-[#e5e5e5] mb-4">
              As a trainer, you have full access to all training materials that youth participants see. Use these to:
            </p>
            <ul className="space-y-2 text-[#e5e5e5] mb-4">
              <li className="flex items-start gap-2">
                <span className="text-[#dc2626] mt-1">•</span>
                <span>Prepare training sessions and familiarize yourself with content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dc2626] mt-1">•</span>
                <span>Answer youth questions during training</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dc2626] mt-1">•</span>
                <span>Guide participants through difficult concepts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#dc2626] mt-1">•</span>
                <span>Troubleshoot technical issues and clarify instructions</span>
              </li>
            </ul>
            <p className="text-sm text-[#a3a3a3]">
              Note: Youth can only access Mapper training. Validator training is restricted to staff only.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
