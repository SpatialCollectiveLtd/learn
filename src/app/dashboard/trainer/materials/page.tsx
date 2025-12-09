"use client";

import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, Video, Download, ExternalLink } from "lucide-react";

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

  // Mock data - replace with API call
  const materials = [
    {
      category: "Digitization - Mapper Training",
      items: [
        {
          title: "Getting Started with OpenStreetMap",
          type: "guide",
          url: "/digitization/mapper/1",
          description: "Introduction to OSM and account creation",
        },
        {
          title: "Understanding the OSM Interface",
          type: "guide",
          url: "/digitization/mapper/2",
          description: "Learn to navigate the OSM platform",
        },
        {
          title: "Building Mapping Tutorial",
          type: "video",
          url: "#",
          description: "Step-by-step video guide for mapping buildings",
        },
      ],
    },
    {
      category: "Digitization - Validator Training",
      items: [
        {
          title: "Data Quality Standards",
          type: "document",
          url: "#",
          description: "Guidelines for validating OSM data",
        },
        {
          title: "Validation Tools Overview",
          type: "guide",
          url: "/digitization/validator/1",
          description: "Introduction to validation tools",
        },
      ],
    },
    {
      category: "Training Resources",
      items: [
        {
          title: "Trainer Handbook",
          type: "document",
          url: "#",
          description: "Complete guide for training delivery",
        },
        {
          title: "Assessment Guidelines",
          type: "document",
          url: "#",
          description: "How to evaluate youth progress",
        },
        {
          title: "Troubleshooting Guide",
          type: "document",
          url: "#",
          description: "Common issues and solutions",
        },
      ],
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'guide':
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

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
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <BookOpen className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">4</p>
              <p className="text-sm text-[#a3a3a3]">Training Modules</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <FileText className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">8</p>
              <p className="text-sm text-[#a3a3a3]">Resources Available</p>
            </div>
            <div className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6">
              <Video className="w-8 h-8 text-purple-500 mb-2" />
              <p className="text-3xl font-bold text-white mb-1">1</p>
              <p className="text-sm text-[#a3a3a3]">Video Tutorials</p>
            </div>
          </div>

          {/* Materials by Category */}
          <div className="space-y-8">
            {materials.map((category, index) => (
              <div key={index}>
                <h2 className="text-2xl font-heading font-bold text-white mb-4">
                  {category.category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="bg-[#1F2121]/50 backdrop-blur-sm border border-[#2a2a2a] rounded-lg p-6 hover:border-[#dc2626]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-[#dc2626]/10 rounded-lg text-[#dc2626]">
                          {getIcon(item.type)}
                        </div>
                        <span className="text-xs px-2 py-1 bg-[#262626] text-[#a3a3a3] rounded">
                          {item.type}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#a3a3a3] mb-4">
                        {item.description}
                      </p>
                      <Link
                        href={item.url}
                        className="inline-flex items-center gap-2 text-sm text-[#dc2626] hover:text-[#b91c1c] transition-colors font-medium"
                      >
                        {item.type === 'guide' ? 'View Guide' : item.type === 'video' ? 'Watch Video' : 'Download'}
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Resources */}
          <div className="mt-12 bg-gradient-to-r from-[#dc2626]/10 to-[#dc2626]/5 border border-[#dc2626]/30 rounded-lg p-6">
            <h3 className="text-xl font-heading font-bold text-white mb-2">
              Need Additional Resources?
            </h3>
            <p className="text-[#e5e5e5] mb-4">
              Can't find what you're looking for? Request additional training materials or suggest new content.
            </p>
            <button className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg transition-colors font-medium">
              Request Materials
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
