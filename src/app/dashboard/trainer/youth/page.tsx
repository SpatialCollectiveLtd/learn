"use client";

import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Search, Filter, UserCheck, MapPin } from "lucide-react";

export default function YouthManagementPage() {
  const router = useRouter();
  const [staffData, setStaffData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
  const youthData = [
    {
      youthId: "KAYTEST001ES",
      fullName: "John Doe",
      email: "john.doe@example.com",
      phone: "+254712345678",
      location: "Nairobi",
      enrollmentDate: "2024-01-15",
      status: "Active",
      completedModules: 2,
      totalModules: 4,
    },
    {
      youthId: "KAYTEST002ES",
      fullName: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+254723456789",
      location: "Kisumu",
      enrollmentDate: "2024-01-20",
      status: "Active",
      completedModules: 3,
      totalModules: 4,
    },
    {
      youthId: "KAYTEST003ES",
      fullName: "Mike Johnson",
      email: "mike.j@example.com",
      phone: "+254734567890",
      location: "Mombasa",
      enrollmentDate: "2024-02-01",
      status: "Active",
      completedModules: 1,
      totalModules: 4,
    },
  ];

  const filteredYouth = youthData.filter(youth => 
    youth.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    youth.youthId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    Youth Management
                  </h1>
                  <p className="text-xs text-[#a3a3a3]">View and manage trainee information</p>
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
              <Users className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">28</p>
              <p className="text-sm text-[#a3a3a3]">Total Trainees</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <UserCheck className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">25</p>
              <p className="text-sm text-[#a3a3a3]">Active Trainees</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <MapPin className="w-8 h-8 text-purple-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">5</p>
              <p className="text-sm text-[#a3a3a3]">Locations</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
              <input
                type="text"
                placeholder="Search by name or Youth ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1F2121] border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 bg-[#262626] hover:bg-[#404040] text-white rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>
          </div>

          {/* Youth Table */}
          <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#262626]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Youth Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                      Enrolled
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {filteredYouth.map((youth) => (
                    <tr key={youth.youthId} className="hover:bg-[#262626]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-[#dc2626] flex items-center justify-center text-white font-bold mr-3">
                            {youth.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{youth.fullName}</div>
                            <div className="text-xs text-[#737373]">{youth.youthId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{youth.email}</div>
                        <div className="text-xs text-[#737373]">{youth.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-white">
                          <MapPin className="w-4 h-4 mr-1 text-[#737373]" />
                          {youth.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {youth.completedModules}/{youth.totalModules} modules
                        </div>
                        <div className="w-full bg-[#262626] rounded-full h-2 mt-1">
                          <div 
                            className="bg-[#dc2626] h-2 rounded-full" 
                            style={{ width: `${(youth.completedModules / youth.totalModules) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/10 text-green-400">
                          {youth.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a3a3a3]">
                        {new Date(youth.enrollmentDate).toLocaleDateString()}
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
