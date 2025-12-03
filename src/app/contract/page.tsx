"use client";

import { useState, useRef, useEffect } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { FileText, CheckCircle, User, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { ErrorModal } from "@/components/ui/error-modal";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ContractPage() {
  const router = useRouter();
  const [youthData, setYouthData] = useState<any>(null);
  const [templateData, setTemplateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const digitalSignatureRef = useRef<any>(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    const fetchContractTemplate = async () => {
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

        // Fetch contract template from API
        const response = await axios.get(
          `${API_URL}/api/contracts/template`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setTemplateData(response.data.data);
        }
      } catch (error: any) {
        console.error('Failed to fetch template:', error);
        setErrorModal({
          isOpen: true,
          message: error.response?.data?.message || 'Failed to load contract template'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractTemplate();
  }, [router]);

  const clearSignature = () => {
    if (digitalSignatureRef.current) {
      digitalSignatureRef.current.clear();
    }
  };

  const handleSubmit = async () => {
    if (!hasAgreed) {
      setErrorModal({
        isOpen: true,
        message: 'Please read and agree to the terms before signing.'
      });
      return;
    }

    if (digitalSignatureRef.current?.isEmpty()) {
      setErrorModal({
        isOpen: true,
        message: 'Please provide your digital signature by signing in the box above.'
      });
      return;
    }

    if (!templateData?.templateId) {
      setErrorModal({
        isOpen: true,
        message: 'Contract template not loaded. Please refresh the page.'
      });
      return;
    }

    setIsSigning(true);

    try {
      // Get signature as base64
      const signatureData = digitalSignatureRef.current.toDataURL();

      // Get youth token
      const token = localStorage.getItem('youthToken');

      // Call API to save signed contract
      const response = await axios.post(
        `${API_URL}/api/contracts/sign`,
        {
          templateId: templateData.templateId,
          signatureData: signatureData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Store agreement acceptance locally as well
        localStorage.setItem(`agreement-accepted-${youthData.youthId}`, 'true');
        localStorage.setItem(`agreement-date-${youthData.youthId}`, new Date().toISOString());

        // Update youth data to reflect contract signing
        const updatedYouthData = { ...youthData, hasSignedContract: true };
        localStorage.setItem('youthData', JSON.stringify(updatedYouthData));

        // Redirect to youth dashboard
        setTimeout(() => {
          router.push('/dashboard/youth');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Failed to save signature:', error);
      setErrorModal({
        isOpen: true,
        message: error.response?.data?.message || 'Failed to save your signature. Please try again.'
      });
      setIsSigning(false);
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

      <div className="relative z-10 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-full mb-4">
              <FileText className="w-8 h-8 text-[#dc2626]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
              Employment Contract Agreement
            </h1>
            <p className="text-[#a3a3a3]">
              Please review and sign the contract below
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

            {/* Contract Content */}
            <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto">
              {/* Participant Info */}
              <div className="bg-black/40 border border-[#2a2a2a] rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3">Participant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#737373]">Full Name:</p>
                    <p className="text-white font-semibold">{youthData?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[#737373]">Youth ID:</p>
                    <p className="text-white font-mono">{youthData?.youthId}</p>
                  </div>
                  <div>
                    <p className="text-[#737373]">Program Type:</p>
                    <p className="text-white capitalize">{youthData?.programType?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-[#737373]">Contract Date:</p>
                    <p className="text-white">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Contract Terms */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Terms and Conditions</h3>

                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                    1. Training Commitment
                  </h4>
                  <p className="text-[#a3a3a3] text-sm pl-6">
                    The participant agrees to actively participate in all assigned training modules, complete assignments within the specified timeframes, and maintain professional conduct throughout the program duration.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                    2. Confidentiality
                  </h4>
                  <p className="text-[#a3a3a3] text-sm pl-6">
                    Any proprietary information, training materials, data, or intellectual property accessed during the program must be kept strictly confidential and used solely for training purposes. Unauthorized disclosure or distribution is prohibited.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                    3. Code of Conduct
                  </h4>
                  <p className="text-[#a3a3a3] text-sm pl-6">
                    The participant commits to upholding the highest standards of integrity, treating all program participants and staff with respect, and adhering to all guidelines and policies established by Spatial Collective Limited.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                    4. Equipment and Resources
                  </h4>
                  <p className="text-[#a3a3a3] text-sm pl-6">
                    Any equipment, software, or resources provided by Spatial Collective must be used responsibly and returned in good condition upon program completion. Participants are responsible for any damage caused by negligence or misuse.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                    5. Data Protection and Privacy
                  </h4>
                  <p className="text-[#a3a3a3] text-sm pl-6">
                    Participant progress, performance data, and personal information will be collected and stored in accordance with applicable data protection laws. This information will be used for program improvement, reporting, and certification purposes only.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                    6. Certification and Completion
                  </h4>
                  <p className="text-[#a3a3a3] text-sm pl-6">
                    Upon successful completion of all required modules, assessments, and practical exercises, the participant will receive an official certificate of completion from Spatial Collective Limited.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                    7. Termination
                  </h4>
                  <p className="text-[#a3a3a3] text-sm pl-6">
                    Spatial Collective reserves the right to terminate this agreement if the participant fails to comply with program requirements, violates the code of conduct, or engages in any form of misconduct.
                  </p>
                </div>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="px-8 pb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-[#2a2a2a] bg-black text-[#dc2626] focus:ring-2 focus:ring-[#dc2626] focus:ring-offset-0"
                />
                <span className="text-[#e5e5e5] text-sm">
                  I have read, understood, and agree to all the terms and conditions outlined in this employment contract. I acknowledge that this is a legally binding agreement.
                </span>
              </label>
            </div>
          </div>

          {/* Signature Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Digital Signature */}
            <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#dc2626]" />
                <h3 className="font-semibold text-white">Digital Signature</h3>
              </div>
              <div className="bg-black border border-[#2a2a2a] rounded-lg mb-3">
                <SignatureCanvas
                  ref={digitalSignatureRef}
                  canvasProps={{
                    className: 'w-full h-32 rounded-lg cursor-crosshair',
                  }}
                  backgroundColor="#000000"
                  penColor="#ffffff"
                />
              </div>
              <button
                onClick={clearSignature}
                className="text-xs text-[#dc2626] hover:text-[#b91c1c] transition-colors"
              >
                Clear Signature
              </button>
              <p className="text-xs text-[#737373] mt-3">
                Sign above using your mouse or touchscreen
              </p>
            </div>

            {/* Handwritten Signature (Empty) */}
            <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#737373]" />
                <h3 className="font-semibold text-white">Handwritten Signature</h3>
              </div>
              <div className="bg-black border border-[#2a2a2a] rounded-lg h-32 flex items-center justify-center mb-3">
                <p className="text-[#737373] text-sm">Physical signature required</p>
              </div>
              <p className="text-xs text-[#737373] mt-3">
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
              <p className="text-xs text-[#737373] mt-3">
                Spatial Collective Limited
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={!hasAgreed || isSigning}
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-4 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isSigning ? 'Processing...' : 'Sign and Continue'}
            </button>
          </div>

          <p className="text-center text-xs text-[#737373] mt-6">
            By clicking "Sign and Continue", you confirm that all information provided is accurate and you accept the terms of this agreement.
          </p>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        message={errorModal.message}
      />
    </main>
  );
}
