import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Use relative URL for same-domain API calls (works in both dev and prod)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface StaffAuthenticationProps {
  onAuthenticated: (data: {
    token: string;
    staff: {
      staffId: string;
      fullName: string;
      role: string;
    };
  }) => void;
}

export const StaffAuthentication: React.FC<StaffAuthenticationProps> = ({
  onAuthenticated,
}) => {
  const router = useRouter();
  const [staffId, setStaffId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Network status detection
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    // Check initial status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check network connectivity before attempting request
    if (!navigator.onLine) {
      router.push('/offline');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/staff/auth/authenticate`, {
        staffId,
      }, {
        timeout: 15000, // 15 second timeout
      });

      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('staffToken', response.data.data.token);
        localStorage.setItem('staffData', JSON.stringify(response.data.data.staff));
        onAuthenticated(response.data.data);
      }
    } catch (err: any) {
      // Network error handling
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        router.push('/offline');
        return;
      }

      // Server error handling
      if (err.response?.status === 503) {
        router.push('/maintenance');
        return;
      }

      // 404 or other errors
      if (err.response?.status === 404) {
        setError('Staff authentication service is currently unavailable. Please try again later.');
      } else {
        setError(err.response?.data?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Network Status Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 text-center text-sm font-medium z-50 shadow-md">
          <div className="flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-2 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            No Internet Connection
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Validator Training Access
          </h1>
          <p className="text-gray-600">
            Spatial Collective Staff Only
          </p>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="staffId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Staff ID
            </label>
            <input
              type="text"
              id="staffId"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value.toUpperCase())}
              placeholder="Enter Staff ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              required
              disabled={isLoading}
              maxLength={12}
            />
            <p className="mt-2 text-sm text-gray-500">
              Contact admin if you don't have a Staff ID
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-400 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !staffId.trim()}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Authenticating...
              </span>
            ) : (
              'Access Training'
            )}
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Need Access?
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              If you don't have a Staff ID or your ID is not recognized, please
              contact your administrator to get registered.
            </p>
            <div className="text-xs text-blue-600">
              <p className="font-medium mb-1">Contact:</p>
              <p>Email: admin@spatialcollective.com</p>
              <p>Include your full name and role in the request</p>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🔒 This content is restricted to authorized Spatial Collective
            staff members only
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffAuthentication;
