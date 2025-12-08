'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface YouthParticipant {
  youth_id: string;
  full_name: string;
  email: string;
  program_type: string;
  is_active: boolean;
  has_signed_contract: boolean;
  signed_at?: string;
  contract_id?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [staffData, setStaffData] = useState<any>(null);
  const [youth, setYouth] = useState<YouthParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'signed' | 'unsigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYouth, setSelectedYouth] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('staffToken');
    const staff = localStorage.getItem('staffData');

    if (!token || !staff) {
      router.push('/dashboard/staff');
      return;
    }

    const staffInfo = JSON.parse(staff);
    
    // Check if user is admin or superadmin
    if (staffInfo.role !== 'admin' && staffInfo.role !== 'superadmin') {
      alert('Access denied. Admin privileges required.');
      router.push('/dashboard/staff');
      return;
    }

    setStaffData(staffInfo);
    fetchYouthParticipants(token);
  }, []);

  const fetchYouthParticipants = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/youth`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      if (response.data.success) {
        setYouth(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching youth:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffData');
        router.push('/dashboard/staff');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffData');
    router.push('/dashboard/staff');
  };

  const toggleYouthSelection = (youthId: string) => {
    const newSelection = new Set(selectedYouth);
    if (newSelection.has(youthId)) {
      newSelection.delete(youthId);
    } else {
      newSelection.add(youthId);
    }
    setSelectedYouth(newSelection);
  };

  const selectAll = () => {
    const filtered = getFilteredYouth();
    setSelectedYouth(new Set(filtered.map(y => y.youth_id)));
  };

  const deselectAll = () => {
    setSelectedYouth(new Set());
  };

  const printSelected = () => {
    if (selectedYouth.size === 0) {
      alert('Please select at least one participant');
      return;
    }

    const youthIds = Array.from(selectedYouth).join(',');
    window.open(`${API_URL}/api/admin/contracts/print?youth_ids=${youthIds}`, '_blank');
  };

  const printAll = () => {
    const filtered = getFilteredYouth().filter(y => y.has_signed_contract);
    if (filtered.length === 0) {
      alert('No signed contracts to print');
      return;
    }

    const youthIds = filtered.map(y => y.youth_id).join(',');
    window.open(`${API_URL}/api/admin/contracts/print?youth_ids=${youthIds}`, '_blank');
  };

  const getFilteredYouth = () => {
    let filtered = youth;

    // Apply contract filter
    if (filter === 'signed') {
      filtered = filtered.filter(y => y.has_signed_contract);
    } else if (filter === 'unsigned') {
      filtered = filtered.filter(y => !y.has_signed_contract);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(y =>
        y.full_name.toLowerCase().includes(query) ||
        y.youth_id.toLowerCase().includes(query) ||
        y.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredYouth = getFilteredYouth();
  const stats = {
    total: youth.length,
    signed: youth.filter(y => y.has_signed_contract).length,
    unsigned: youth.filter(y => !y.has_signed_contract).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12">
                <Image
                  src="/spatial-collective-logo.jpg"
                  alt="Spatial Collective"
                  fill
                  className="object-contain rounded-full"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-400">Contract Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{staffData?.fullName}</p>
                <p className="text-xs text-gray-400 capitalize">{staffData?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Participants</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-600 bg-opacity-20 p-3 rounded-full">
                <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Contracts Signed</p>
                <p className="text-3xl font-bold text-green-500 mt-2">{stats.signed}</p>
              </div>
              <div className="bg-green-600 bg-opacity-20 p-3 rounded-full">
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Signatures</p>
                <p className="text-3xl font-bold text-yellow-500 mt-2">{stats.unsigned}</p>
              </div>
              <div className="bg-yellow-600 bg-opacity-20 p-3 rounded-full">
                <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('signed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'signed'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Signed ({stats.signed})
              </button>
              <button
                onClick={() => setFilter('unsigned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unsigned'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Pending ({stats.unsigned})
              </button>
            </div>

            {/* Print Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={printSelected}
                disabled={selectedYouth.size === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Print Selected ({selectedYouth.size})
              </button>
              <button
                onClick={printAll}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Print All Signed
              </button>
            </div>
          </div>

          {/* Selection Controls */}
          {filteredYouth.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={selectAll}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                Deselect All
              </button>
            </div>
          )}
        </div>

        {/* Youth Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Youth ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Contract Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredYouth.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? 'No participants match your search' : 'No participants found'}
                    </td>
                  </tr>
                ) : (
                  filteredYouth.map((participant) => (
                    <tr key={participant.youth_id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedYouth.has(participant.youth_id)}
                          onChange={() => toggleYouthSelection(participant.youth_id)}
                          disabled={!participant.has_signed_contract}
                          className="w-4 h-4 text-red-600 bg-gray-900 border-gray-600 rounded focus:ring-red-500 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {participant.youth_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {participant.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {participant.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-600 bg-opacity-20 text-blue-400">
                          {participant.program_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {participant.has_signed_contract ? (
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-green-400">Signed</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-yellow-400">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {participant.has_signed_contract ? (
                          <button
                            onClick={() => window.open(`${API_URL}/api/admin/contracts/view/${participant.contract_id}`, '_blank')}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            View Contract
                          </button>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing {filteredYouth.length} of {stats.total} participants
        </div>
      </main>
    </div>
  );
}
