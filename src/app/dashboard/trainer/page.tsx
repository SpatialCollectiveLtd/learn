"use client";

import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { CometCard } from "@/components/ui/comet-card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  GraduationCap, 
  LogOut, 
  Users, 
  BookOpen, 
  BarChart3, 
  CheckCircle2,
  Clock,
  TrendingUp
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function TrainerDashboard() {
  const router = useRouter();
  const [staffData, setStaffData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [youthCount, setYouthCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      // Check if user is authenticated as trainer
      const token = localStorage.getItem('staffToken');
      const staff = localStorage.getItem('staffData');

      if (!token || !staff) {
        router.push('/');
        return;
      }

      const staffInfo = JSON.parse(staff);
      
      // Only trainers can access this page
      if (staffInfo.role !== 'trainer') {
        router.push('/dashboard/staff');
        return;
      }

      setStaffData(staffInfo);

      try {
        // Fetch recent activity
        const activityResponse = await axios.get(`${API_URL}/api/trainer/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (activityResponse.data.success) {
          setActivities(activityResponse.data.data.activities);
        }

        // Fetch youth count
        const youthResponse = await axios.get(`${API_URL}/api/trainer/youth`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (youthResponse.data.success) {
          setYouthCount(youthResponse.data.data.activeCount);
        }
      } catch (error) {
        console.error('Error fetching trainer data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffData');
    router.push('/');
  };

  // Quick stats for trainers
  const stats = [
    { label: "Active Trainees", value: youthCount.toString(), icon: Users, color: "text-blue-500" },
    { label: "Modules", value: "4", icon: BookOpen, color: "text-green-500" },
    { label: "Completion Rate", value: "N/A", icon: TrendingUp, color: "text-purple-500" },
    { label: "Pending Reviews", value: "N/A", icon: Clock, color: "text-orange-500" },
  ];

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case 'CheckCircle2': return CheckCircle2;
      case 'Clock': return Clock;
      case 'Users': return Users;
      default: return CheckCircle2;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'completion': return 'text-green-500';
      case 'review': return 'text-orange-500';
      case 'registration': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const quickActions = [
    {
      title: "View Youth Progress",
      description: "Monitor trainee progress across all modules",
      link: "/dashboard/trainer/progress",
      icon: <BarChart3 className="w-12 h-12" />,
      available: false,
    },
    {
      title: "Review Submissions",
      description: "Check and approve youth mapping submissions",
      link: "/dashboard/trainer/reviews",
      icon: <CheckCircle2 className="w-12 h-12" />,
      available: false,
    },
    {
      title: "Training Materials",
      description: "Access and manage training content",
      link: "/dashboard/trainer/materials",
      icon: <BookOpen className="w-12 h-12" />,
      available: true,
    },
    {
      title: "Youth Management",
      description: "View and manage trainee information",
      link: "/dashboard/trainer/youth",
      icon: <Users className="w-12 h-12" />,
      available: false,
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
        {/* Header */}
        <header className="bg-[#1F2121]/80 backdrop-blur-sm border-b border-[#2a2a2a] sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-[#dc2626] text-2xl font-bold">SC</div>
                <div>
                  <h1 className="text-lg font-heading font-bold text-white">
                    Trainer Portal
                  </h1>
                  <p className="text-xs text-[#a3a3a3]">Training Management</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">
                    {staffData?.fullName}
                  </p>
                  <p className="text-xs text-[#a3a3a3]">
                    {staffData?.staffId} • Trainer
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
              Welcome back, {staffData?.fullName?.split(' ')[0]}! 👋
            </h2>
            <p className="text-[#a3a3a3]">
              Manage your training sessions and monitor youth progress
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-[#a3a3a3]">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-2xl font-heading font-bold text-white mb-6">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <CometCard key={index}>
                  <div className="h-full flex flex-col p-6">
                    <div className="text-[#dc2626] mb-4">{action.icon}</div>
                    <h4 className="text-xl font-heading font-semibold text-white mb-2">
                      {action.title}
                    </h4>
                    <p className="text-[#a3a3a3] text-sm mb-6 flex-grow">
                      {action.description}
                    </p>
                    {action.available ? (
                      <Link
                        href={action.link}
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Access
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#2a2a2a] text-[#737373] rounded-lg cursor-not-allowed text-sm font-medium"
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                </CometCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
