"use client";

import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, TrendingUp, CheckCircle2, Clock, User } from "lucide-react";

export default function YouthProgressPage() {
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

  // Mock data - replace with API call
  const progressData = [
    {
      youthId: "KAYTEST001ES",
      name: "John Doe",
      currentModule: "Digitization - Mapper",
      currentStep: "Step 3 of 5",
      progress: 60,
      status: "In Progress",
      lastActive: "2 hours ago",
    },
    {
      youthId: "KAYTEST002ES",
      name: "Jane Smith",
      currentModule: "Digitization - Mapper",
      currentStep: "Step 5 of 5",
      progress: 100,
      status: "Completed",
      lastActive: "1 day ago",
    },
    {
      youthId: "KAYTEST003ES",
      name: "Mike Johnson",
      currentModule: "Digitization - Mapper",
      currentStep: "Step 2 of 5",
      progress: 40,
      status: "In Progress",
      lastActive: "5 hours ago",
    },
  ];

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
                    Youth Progress
                  </h1>
                  <p className="text-xs text-[#a3a3a3]">Monitor trainee progress</p>
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
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">28</p>
              <p className="text-sm text-[#a3a3a3]">Total Trainees</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">15</p>
              <p className="text-sm text-[#a3a3a3]">Completed Modules</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">72%</p>
              <p className="text-sm text-[#a3a3a3]">Average Progress</p>
            </div>
          </div>

          {/* Progress Table */}
          <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-xl font-heading font-bold text-white">Trainee Progress Overview</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#262626]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Youth ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Current Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {progressData.map((youth) => (
                    <tr key={youth.youthId} className="hover:bg-[#262626]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{youth.youthId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-[#dc2626] flex items-center justify-center text-white text-sm font-bold mr-3">
                            {youth.name.charAt(0)}
                          </div>
                          <div className="text-sm text-white">{youth.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{youth.currentModule}</div>
                        <div className="text-xs text-[#737373]">{youth.currentStep}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full bg-[#262626] rounded-full h-2 mr-2" style={{ width: '100px' }}>
                            <div 
                              className="bg-[#dc2626] h-2 rounded-full" 
                              style={{ width: `${youth.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-white">{youth.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          youth.status === 'Completed' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {youth.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a3a3a3]">
                        {youth.lastActive}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
