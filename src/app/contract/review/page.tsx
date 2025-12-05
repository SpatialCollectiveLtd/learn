"use client";

import { useState, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { FileText, CheckCircle, User, Shield, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ContractReviewPage() {
  const router = useRouter();
  const [youthData, setYouthData] = useState<any>(null);
  const [contractData, setContractData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContractData = async () => {
      // Check if user is authenticated as youth
      const userType = localStorage.getItem('userType');
      const storedYouthData = localStorage.getItem('youthData');
      const token = localStorage.getItem('youthToken');

      if (userType !== 'youth' || !storedYouthData || !token) {
        router.push('/');
        return;
      }

      try {
        const parsed = JSON.parse(storedYouthData);
        setYouthData(parsed);

        // Fetch signed contract from API
        const response = await axios.get(
          `${API_URL}/api/contracts/signed`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setContractData(response.data.data);
        }
      } catch (err: any) {
        console.error('Failed to fetch contract:', err);
        setError(err.response?.data?.message || 'Failed to load contract data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]"></div>
          <p className="mt-4 text-[#e5e5e5]">Loading your contract...</p>
        </div>
      </div>
    );
  }

  if (error || !contractData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText className="w-16 h-16 text-[#dc2626] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Contract Not Found</h1>
          <p className="text-[#a3a3a3] mb-6">{error || 'No signed contract found'}</p>
          <Link
            href="/dashboard/youth"
            className="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />

      <div className="relative z-10 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Back Button */}
          <Link
            href="/dashboard/youth"
            className="inline-flex items-center gap-2 text-[#a3a3a3] hover:text-[#dc2626] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-full mb-4">
              <FileText className="w-8 h-8 text-[#dc2626]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
              Your Signed Contract
            </h1>
            <p className="text-[#a3a3a3]">
              Employment Contract Agreement - Signed Copy
            </p>
          </div>

          {/* Contract Document */}
          <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden mb-8">
            {/* Contract Header */}
            <div className="bg-[#dc2626] text-white p-6">
              <h2 className="text-2xl font-heading font-bold mb-2">
                SPATIAL COLLECTIVE LIMITED
              </h2>
              <p className="text-red-100">Youth Training Program - Employment Contract</p>
            </div>

            {/* Signed Status Banner */}
            <div className="bg-green-900/20 border-b border-green-900/30 p-4">
              <div className="flex items-center gap-3 justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 font-semibold">
                  Contract Signed on {new Date(contractData.signed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Contract Content */}
            <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto">
              {/* Participant Info */}
              <div className="bg-black/40 border border-[#2a2a2a] rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3">Participant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#737373]">Full Name:</p>
                    <p className="text-white font-semibold">{contractData.youth_name}</p>
                  </div>
                  <div>
                    <p className="text-[#737373]">Youth ID:</p>
                    <p className="text-white font-mono">{contractData.youth_id}</p>
                  </div>
                  <div>
                    <p className="text-[#737373]">Program Type:</p>
                    <p className="text-white capitalize">{contractData.program_type?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-[#737373]">Contract Version:</p>
                    <p className="text-white">{contractData.version}</p>
                  </div>
                </div>
              </div>

              {/* Contract Terms - Simplified for review */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Terms and Conditions</h3>
                <p className="text-[#a3a3a3] text-sm">
                  This contract includes all terms and conditions related to your training program participation,
                  including program scope, duration, responsibilities, and certification requirements.
                </p>
              </div>
            </div>

            {/* Agreement Status */}
            <div className="px-8 pb-6">
              <div className="flex items-start gap-3 bg-green-900/10 border border-green-900/30 rounded-lg p-4">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-green-400 text-sm">
                  You have read, understood, and agreed to all the terms and conditions outlined in this employment contract.
                </span>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Digital Signature */}
            <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#dc2626]" />
                <h3 className="font-semibold text-white">Your Digital Signature</h3>
              </div>
              <div className="bg-black border border-[#2a2a2a] rounded-lg h-32 flex items-center justify-center mb-3 overflow-hidden">
                {contractData.signature_data ? (
                  <img
                    src={contractData.signature_data}
                    alt="Your signature"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <p className="text-[#737373] text-sm">No signature available</p>
                )}
              </div>
              <p className="text-xs text-[#737373]">
                Signed digitally on {new Date(contractData.signed_at).toLocaleDateString()}
              </p>
            </div>

            {/* Handwritten Signature */}
            <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#737373]" />
                <h3 className="font-semibold text-white">Handwritten Signature</h3>
              </div>
              <div className="bg-black border border-[#2a2a2a] rounded-lg h-32 flex items-center justify-center mb-3">
                <p className="text-[#737373] text-sm">Physical signature required</p>
              </div>
              <p className="text-xs text-[#737373]">
                To be signed on physical contract document
              </p>
            </div>

            {/* SC Admin Signature */}
            <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[#dc2626]" />
                <h3 className="font-semibold text-white">SC Administration</h3>
              </div>
              <div className="bg-black border border-[#2a2a2a] rounded-lg h-32 flex items-center justify-center mb-3">
                <div className="text-center">
                  <div className="text-[#dc2626] text-lg font-heading mb-1">SC Admin</div>
                  <div className="h-px bg-[#2a2a2a] w-32 mx-auto mb-1"></div>
                  <p className="text-[#737373] text-xs">Authorized Signature</p>
                </div>
              </div>
              <p className="text-xs text-[#737373]">
                Spatial Collective Limited
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-[#737373]">
            This is a legally binding agreement. For questions or concerns, please contact your program administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
