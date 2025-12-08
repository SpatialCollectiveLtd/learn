import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Use relative URL for same-domain API calls (works in both dev and prod)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface YouthAuthenticationProps {
  onAuthenticated: (data: {
    token: string;
    youth: {
      youthId: string;
      fullName: string;
      programType: string;
      hasSignedContract: boolean;
    };
  }) => void;
}

export const YouthAuthentication: React.FC<YouthAuthenticationProps> = ({
  onAuthenticated,
}) => {
  const router = useRouter();
  const [youthId, setYouthId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check internet connection first
    if (!navigator.onLine) {
      router.push('/offline');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/youth/auth/authenticate`, {
        youthId,
      }, {
        timeout: 15000, // 15 second timeout
      });

      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('youthToken', response.data.data.token);
        localStorage.setItem('youthData', JSON.stringify(response.data.data.youth));
        onAuthenticated(response.data.data);
      }
    } catch (err: any) {
      // Handle different types of errors
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || !navigator.onLine) {
        router.push('/offline');
      } else if (err.response?.status === 503) {
        router.push('/maintenance');
      } else if (err.response?.status === 404) {
        setError('Service not found. Please contact support.');
      } else {
        setError(err.response?.data?.message || 'Authentication failed. Please check your Youth ID and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      {/* Network Status Indicator */}
      {!isOnline && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">No Internet Connection</span>
        </div>
      )}
      
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Youth Training Program
          </h1>
          <p className="text-gray-600">
            Spatial Collective Ltd
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Sign your contract agreement to begin
          </p>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="youthId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Youth ID
            </label>
            <input
              type="text"
              id="youthId"
              value={youthId}
              onChange={(e) => setYouthId(e.target.value.toUpperCase())}
              placeholder="YT001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              required
              disabled={isLoading}
              maxLength={10}
            />
            <p className="mt-2 text-sm text-gray-500">
              Format: YT### (e.g., YT001, YT123)
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
            disabled={isLoading || !youthId.trim()}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              'Continue to Contract'
            )}
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-blue-700">
              If you don't have a Youth ID or your ID is not recognized, please
              contact your program coordinator.
            </p>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🔒 You must sign the contract agreement before accessing training materials
          </p>
        </div>
      </div>
    </div>
  );
};

export default YouthAuthentication;
