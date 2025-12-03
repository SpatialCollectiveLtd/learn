"use client";

import { X, AlertCircle } from "lucide-react";
import { useEffect } from "react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function ErrorModal({ isOpen, onClose, title = "Error", message }: ErrorModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1F2121] border border-[#2a2a2a] rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#737373] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-full mb-4">
          <AlertCircle className="w-6 h-6 text-[#dc2626]" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-heading font-bold text-white mb-2">
          {title}
        </h3>
        <p className="text-[#a3a3a3] mb-6">
          {message}
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
