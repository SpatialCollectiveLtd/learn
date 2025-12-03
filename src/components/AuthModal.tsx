"use client";

import React, { useState } from 'react';
import { X, Shield } from 'lucide-react';
import {
  authenticateStaffId,
  type AuthenticationResult,
} from '../data/validator-training';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (staffId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [staffId, setStaffId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const result: AuthenticationResult = authenticateStaffId(staffId);

      if (result.success && result.staffId) {
        sessionStorage.setItem('validatorStaffId', result.staffId);
        if (result.credentials?.name) {
          sessionStorage.setItem('validatorStaffName', result.credentials.name);
        }
        onAuthenticated(result.staffId);
        onClose();
      } else {
        setError(result.message);
      }

      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1F2121] border border-[#2a2a2a] rounded-xl shadow-2xl max-w-md w-full p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#e5e5e5] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#dc2626]/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-[#dc2626]" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-white mb-2">
            Staff Authentication
          </h2>
          <p className="text-[#a3a3a3] text-sm">
            Enter your staff ID to access validator training
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="staffId"
              className="block text-sm font-medium text-[#e5e5e5] mb-2"
            >
              Staff ID
            </label>
            <input
              type="text"
              id="staffId"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-all"
              placeholder="Enter your staff ID"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg">
              <p className="text-sm text-[#dc2626]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Authenticating...' : 'Access Training'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
          <p className="text-xs text-[#737373] text-center">
            Only authorized staff members can access this training module.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
