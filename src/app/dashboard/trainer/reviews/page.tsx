"use client";

import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Clock, MapPin, ExternalLink } from "lucide-react";

export default function ReviewSubmissionsPage() {
  const router = useRouter();
  const [staffData, setStaffData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

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
  const submissions = [
    {
      id: 1,
      youthId: "KAYTEST001ES",
      youthName: "John Doe",
      taskType: "Building Mapping",
      submittedAt: "2 hours ago",
      status: "pending",
      changesetUrl: "https://www.openstreetmap.org/changeset/12345",
      osmUsername: "johndoe_mapper",
    },
    {
      id: 2,
      youthId: "KAYTEST002ES",
      youthName: "Jane Smith",
      taskType: "Road Mapping",
      submittedAt: "5 hours ago",
      status: "pending",
      changesetUrl: "https://www.openstreetmap.org/changeset/12346",
      osmUsername: "janesmith_osm",
    },
    {
      id: 3,
      youthId: "KAYTEST003ES",
      youthName: "Mike Johnson",
      taskType: "Building Mapping",
      submittedAt: "1 day ago",
      status: "approved",
      changesetUrl: "https://www.openstreetmap.org/changeset/12344",
      osmUsername: "mikejohnson",
    },
  ];

  const filteredSubmissions = filter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filter);

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
                    Review Submissions
                  </h1>
                  <p className="text-xs text-[#a3a3a3]">Check and approve mapping work</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <Clock className="w-8 h-8 text-orange-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">5</p>
              <p className="text-sm text-[#a3a3a3]">Pending Review</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">42</p>
              <p className="text-sm text-[#a3a3a3]">Approved</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <XCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">3</p>
              <p className="text-sm text-[#a3a3a3]">Rejected</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <MapPin className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">50</p>
              <p className="text-sm text-[#a3a3a3]">Total Submissions</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-[#dc2626] text-white'
                    : 'bg-[#262626] text-[#a3a3a3] hover:bg-[#404040] hover:text-white'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Submissions List */}
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div 
                key={submission.id}
                className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#dc2626] flex items-center justify-center text-white font-bold">
                        {submission.youthName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{submission.youthName}</h3>
                        <p className="text-sm text-[#737373]">{submission.youthId}</p>
                      </div>
                    </div>
                    <div className="ml-13">
                      <p className="text-white mb-1">
                        <span className="text-[#a3a3a3]">Task:</span> {submission.taskType}
                      </p>
                      <p className="text-white mb-1">
                        <span className="text-[#a3a3a3]">OSM Username:</span> {submission.osmUsername}
                      </p>
                      <p className="text-sm text-[#737373]">Submitted {submission.submittedAt}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    submission.status === 'pending' 
                      ? 'bg-orange-500/10 text-orange-400' 
                      : submission.status === 'approved'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <a
                    href={submission.changesetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#262626] hover:bg-[#404040] text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Changeset
                  </a>
                  {submission.status === 'pending' && (
                    <>
                      <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
