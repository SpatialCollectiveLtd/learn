import React, { useState, useEffect } from 'react';
import StaffAuthentication from './StaffAuthentication';

interface ValidatorTrainingWrapperProps {
  children: React.ReactNode;
}

export const ValidatorTrainingWrapper: React.FC<ValidatorTrainingWrapperProps> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [staffRole, setStaffRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated via JWT token
  useEffect(() => {
    const storedToken = localStorage.getItem('staffToken');
    const storedStaffId = localStorage.getItem('staffId');
    const storedStaffName = localStorage.getItem('staffName');
    const storedStaffRole = localStorage.getItem('staffRole');

    if (storedToken && storedStaffId) {
      setStaffId(storedStaffId);
      setStaffName(storedStaffName);
      setStaffRole(storedStaffRole);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  const handleAuthenticated = (data: { token: string; staff: { staffId: string; fullName: string; role: string } }) => {
    // Store JWT and staff info in localStorage
    localStorage.setItem('staffToken', data.token);
    localStorage.setItem('staffId', data.staff.staffId);
    localStorage.setItem('staffName', data.staff.fullName);
    localStorage.setItem('staffRole', data.staff.role);

    setStaffId(data.staff.staffId);
    setStaffName(data.staff.fullName);
    setStaffRole(data.staff.role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffId');
    localStorage.removeItem('staffName');
    localStorage.removeItem('staffRole');
    setStaffId(null);
    setStaffName(null);
    setStaffRole(null);
    setIsAuthenticated(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return <StaffAuthentication onAuthenticated={handleAuthenticated} />;
  }

  // Show training content with logout option
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Staff Info Bar */}
      <div className="bg-indigo-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg
                className="w-5 h-5"
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
              <div>
                <span className="text-sm font-medium">
                  {staffName ? `Welcome, ${staffName}` : 'Authenticated Staff'}
                </span>
                <span className="text-indigo-200 text-xs ml-2">
                  (ID: {staffId})
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-indigo-100 hover:text-white transition-colors flex items-center space-x-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Training Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>

      {/* Restricted Access Footer */}
      <div className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-gray-500">
            🔒 Validator Training - Restricted Content - Spatial Collective
            Staff Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default ValidatorTrainingWrapper;
