"use client";

import React from 'react';
import { X, FileText, CheckCircle } from 'lucide-react';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  youthName: string;
}

export const AgreementModal: React.FC<AgreementModalProps> = ({
  isOpen,
  onClose,
  onAgree,
  youthName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1F2121] border border-[#2a2a2a] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#2a2a2a]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#e5e5e5] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#dc2626]/10 rounded-full">
              <FileText className="w-6 h-6 text-[#dc2626]" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-white">
                Training Agreement
              </h2>
              <p className="text-[#a3a3a3] text-sm mt-1">
                Please review and accept to begin your training
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-black/40 border border-[#2a2a2a] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-3">
              Welcome, {youthName}!
            </h3>
            <p className="text-[#e5e5e5] leading-relaxed">
              Before you begin your training journey with Spatial Collective, please take a moment to review and understand the following agreement.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                Training Commitment
              </h4>
              <p className="text-[#a3a3a3] text-sm pl-6">
                You commit to actively participate in all training modules, complete assignments on time, and maintain professional conduct throughout the program.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                Confidentiality
              </h4>
              <p className="text-[#a3a3a3] text-sm pl-6">
                Any proprietary information, training materials, and data accessed during the program must be kept confidential and used solely for training purposes.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                Code of Conduct
              </h4>
              <p className="text-[#a3a3a3] text-sm pl-6">
                You agree to uphold the highest standards of integrity, respect fellow participants, and follow all guidelines provided by Spatial Collective.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                Data Usage
              </h4>
              <p className="text-[#a3a3a3] text-sm pl-6">
                Your progress and performance data will be tracked for program improvement purposes. Personal information will be handled in accordance with our privacy policy.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 text-[#dc2626] mr-2" />
                Certificate & Completion
              </h4>
              <p className="text-[#a3a3a3] text-sm pl-6">
                Upon successful completion of all modules and assessments, you will receive a certificate of completion from Spatial Collective.
              </p>
            </div>
          </div>

          <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg p-4">
            <p className="text-[#e5e5e5] text-sm">
              <strong className="text-white">Important:</strong> By clicking "I Agree and Continue" below, you acknowledge that you have read, understood, and agree to abide by all the terms outlined in this training agreement.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2a2a2a] bg-black/20">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#252727] hover:bg-[#2a2a2a] text-[#e5e5e5] font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAgree}
              className="px-6 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold rounded-lg transition-colors"
            >
              I Agree and Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementModal;
