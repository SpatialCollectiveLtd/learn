"use client";

import { useState } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Shield, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'youth' | 'staff'>('youth');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleYouthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/youth/auth/authenticate`, {
        youthId: userId,
      });

      if (response.data.success) {
        const { token, youth } = response.data.data;

        // Store authentication data
        localStorage.setItem('youthToken', token);
        localStorage.setItem('youthData', JSON.stringify(youth));
        localStorage.setItem('userType', 'youth');

        // Check if contract has been signed
        const agreementAccepted = localStorage.getItem(`agreement-accepted-${youth.youthId}`);

        if (!agreementAccepted) {
          // First time login - redirect to contract signing
          router.push('/contract');
        } else {
          // Returning user - redirect to dashboard
          router.push('/dashboard/youth');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your Youth ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/staff/auth/authenticate`, {
        staffId: userId,
      });

      if (response.data.success) {
        const { token, staff } = response.data.data;

        // Store staff authentication in localStorage
        localStorage.setItem('staffToken', token);
        localStorage.setItem('staffData', JSON.stringify(staff));

        // Route based on staff role
        if (staff.role === 'trainer') {
          router.push('/dashboard/trainer');
        } else if (staff.role === 'admin') {
          router.push('/dashboard/admin');
        } else {
          // superadmin
          router.push('/dashboard/staff');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your Staff ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = loginType === 'youth' ? handleYouthLogin : handleStaffLogin;

  return (
    <main className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      <BackgroundBeams className="opacity-40" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-white mb-2">
            <span className="text-[#dc2626]">SC</span> Training Hub
          </h1>
          <p className="text-[#a3a3a3]">Spatial Collective Learning Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 border-b border-[#2a2a2a]">
            <button
              onClick={() => {
                setLoginType('youth');
                setUserId('');
                setError('');
              }}
              className={`py-4 px-6 font-semibold transition-all ${
                loginType === 'youth'
                  ? 'bg-[#dc2626] text-white'
                  : 'bg-transparent text-[#a3a3a3] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                <span>Youth</span>
              </div>
            </button>
            <button
              onClick={() => {
                setLoginType('staff');
                setUserId('');
                setError('');
              }}
              className={`py-4 px-6 font-semibold transition-all ${
                loginType === 'staff'
                  ? 'bg-[#dc2626] text-white'
                  : 'bg-transparent text-[#a3a3a3] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Staff</span>
              </div>
            </button>
          </div>

          {/* Login Form */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-white mb-2">
                {loginType === 'youth' ? 'Youth Login' : 'Staff Login'}
              </h2>
              <p className="text-[#a3a3a3] text-sm">
                {loginType === 'youth'
                  ? 'Enter your Youth ID to access your training'
                  : 'Enter your Staff ID to access the platform'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="userId"
                  className="block text-sm font-medium text-[#e5e5e5] mb-2"
                >
                  {loginType === 'youth' ? 'Youth ID' : 'Staff ID'}
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-all"
                  placeholder={loginType === 'youth' ? 'e.g., YT001' : 'e.g., STEA8103SA'}
                  required
                  autoFocus
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
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
              <p className="text-xs text-[#737373] text-center">
                {loginType === 'youth'
                  ? 'First time logging in? You\'ll be guided through the contract signing process.'
                  : 'Only authorized Spatial Collective staff members can access this platform.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[#737373] text-sm">
            © {new Date().getFullYear()} Spatial Collective. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
