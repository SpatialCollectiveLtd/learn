'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Users, CheckCircle, AlertTriangle, Search, Printer, Eye, Shield, LogOut } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<'selected' | 'all' | null>(null);

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

    // Auto-refresh every 30 seconds to get latest data
    const interval = setInterval(() => {
      fetchYouthParticipants(token);
    }, 30000);

    return () => clearInterval(interval);
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
      setErrorMessage('Please select at least one participant to print contracts.');
      setShowErrorModal(true);
      return;
    }

    // Check if selected youth have signed contracts
    const selectedParticipants = youth.filter(y => selectedYouth.has(y.youth_id));
    const signedCount = selectedParticipants.filter(y => y.has_signed_contract).length;
    
    if (signedCount === 0) {
      setErrorMessage('None of the selected participants have signed contracts.');
      setShowErrorModal(true);
      return;
    }

    setConfirmAction('selected');
    setShowConfirmModal(true);
  };

  const printAll = () => {
    const filtered = getFilteredYouth().filter(y => y.has_signed_contract);
    if (filtered.length === 0) {
      setErrorMessage('No signed contracts available to print. Please ensure participants have completed and signed their contracts.');
      setShowErrorModal(true);
      return;
    }

    setConfirmAction('all');
    setShowConfirmModal(true);
  };

  const handleConfirmPrint = () => {
    try {
      if (confirmAction === 'selected') {
        const selectedParticipants = youth.filter(y => selectedYouth.has(y.youth_id) && y.has_signed_contract);
        const youthIds = selectedParticipants.map(y => y.youth_id).join(',');
        window.open(`${API_URL}/api/admin/contracts/print?youth_ids=${youthIds}`, '_blank');
      } else if (confirmAction === 'all') {
        const filtered = getFilteredYouth().filter(y => y.has_signed_contract);
        const youthIds = filtered.map(y => y.youth_id).join(',');
        window.open(`${API_URL}/api/admin/contracts/print?youth_ids=${youthIds}`, '_blank');
      }
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error) {
      setErrorMessage('Failed to open print window. Please check your browser settings and try again.');
      setShowErrorModal(true);
      setShowConfirmModal(false);
    }
  };

  const handleCancelPrint = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const viewContract = (contractId: string) => {
    try {
      window.open(`${API_URL}/api/admin/contracts/view/${contractId}`, '_blank');
    } catch (error) {
      setErrorMessage('Failed to open contract. Please try again.');
      setShowErrorModal(true);
    }
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
  
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredYouth.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredYouth.length / itemsPerPage);

  const stats = {
    total: youth.length,
    signed: youth.filter(y => y.has_signed_contract).length,
    unsigned: youth.filter(y => !y.has_signed_contract).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]"></div>
          <p className="mt-4 text-[#e5e5e5]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#1F2121] border-b border-[#2a2a2a] sticky top-0 z-50 shadow-lg">
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
                <h1 className="text-xl font-heading font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-[#a3a3a3]">Contract Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{staffData?.fullName}</p>
                <p className="text-xs text-[#a3a3a3] capitalize">{staffData?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a3a3a3] text-sm">Total Participants</p>
                <p className="text-3xl font-heading font-bold text-white mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-600 bg-opacity-20 p-3 rounded-full">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a3a3a3] text-sm">Contracts Signed</p>
                <p className="text-3xl font-heading font-bold text-green-500 mt-2">{stats.signed}</p>
              </div>
              <div className="bg-green-600 bg-opacity-20 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#a3a3a3] text-sm">Pending Signatures</p>
                <p className="text-3xl font-heading font-bold text-yellow-500 mt-2">{stats.unsigned}</p>
              </div>
              <div className="bg-yellow-600 bg-opacity-20 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a3a3a3]" />
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-[#a3a3a3] focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-[#dc2626] text-white'
                    : 'bg-[#2a2a2a] text-[#e5e5e5] hover:bg-[#3a3a3a]'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('signed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'signed'
                    ? 'bg-[#dc2626] text-white'
                    : 'bg-[#2a2a2a] text-[#e5e5e5] hover:bg-[#3a3a3a]'
                }`}
              >
                Signed ({stats.signed})
              </button>
              <button
                onClick={() => setFilter('unsigned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unsigned'
                    ? 'bg-[#dc2626] text-white'
                    : 'bg-[#2a2a2a] text-[#e5e5e5] hover:bg-[#3a3a3a]'
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-[#2a2a2a] disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Selected ({selectedYouth.size})</span>
              </button>
              <button
                onClick={printAll}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print All Signed</span>
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
                className="text-sm text-[#a3a3a3] hover:text-[#e5e5e5]"
              >
                Deselect All
              </button>
            </div>
          )}
        </div>

        {/* Youth Table */}
        <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                    Youth ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                    Contract Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#a3a3a3]">
                      {searchQuery ? 'No participants match your search' : 'No participants found'}
                    </td>
                  </tr>
                ) : (
                  currentItems.map((participant) => (
                    <tr key={participant.youth_id} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedYouth.has(participant.youth_id)}
                          onChange={() => toggleYouthSelection(participant.youth_id)}
                          disabled={!participant.has_signed_contract}
                          className="w-4 h-4 bg-[#1F2121] border-[#2a2a2a] rounded checked:bg-[#dc2626] focus:ring-[#dc2626] disabled:opacity-50"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#e5e5e5]">
                        {participant.youth_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#e5e5e5]">
                        {participant.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#a3a3a3]">
                        {participant.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-600 bg-opacity-20 text-blue-400">
                          {participant.program_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {participant.has_signed_contract ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-400">Signed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm text-yellow-400">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {participant.has_signed_contract ? (
                          <button
                            onClick={() => window.open(`${API_URL}/api/admin/contracts/view/${participant.contract_id}`, '_blank')}
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            View Contract
                          </button>
                        ) : (
                          <span className="text-[#a3a3a3]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-[#a3a3a3]">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredYouth.length)} of {filteredYouth.length} participants
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#1F2121] border border-[#2a2a2a] rounded-lg text-[#e5e5e5] hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#dc2626] text-white'
                        : 'bg-[#1F2121] border border-[#2a2a2a] text-[#e5e5e5] hover:bg-[#2a2a2a]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#1F2121] border border-[#2a2a2a] rounded-lg text-[#e5e5e5] hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-4 text-center text-sm text-[#a3a3a3]">
          Showing {filteredYouth.length} of {stats.total} participants
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center">
                <Printer className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-heading text-[#e5e5e5]">Confirm Print Action</h3>
            </div>
            
            <p className="text-[#a3a3a3] mb-6">
              {confirmAction === 'selected' 
                ? `You are about to print contracts for ${youth.filter(y => selectedYouth.has(y.youth_id) && y.has_signed_contract).length} selected participant(s). This will open a new window with the contracts ready for printing.`
                : `You are about to print all ${getFilteredYouth().filter(y => y.has_signed_contract).length} signed contracts. This will open a new window with all contracts ready for printing.`
              }
            </p>

            <div className="bg-yellow-600 bg-opacity-10 border border-yellow-600 border-opacity-30 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-400">
                  Please ensure your printer is ready and configured correctly before proceeding.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelPrint}
                className="flex-1 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e5e5e5] rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPrint}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Contracts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-600 bg-opacity-20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-heading text-[#e5e5e5]">Action Required</h3>
            </div>
            
            <p className="text-[#a3a3a3] mb-6">
              {errorMessage}
            </p>

            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full px-4 py-2 bg-[#dc2626] hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
