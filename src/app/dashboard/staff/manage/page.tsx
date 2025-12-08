"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Shield, UserPlus, Trash2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface StaffMember {
  staff_id: string;
  full_name: string;
  email: string;
  role: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

export default function SuperAdminStaffManagement() {
  const router = useRouter();
  const [staffData, setStaffData] = useState<any>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    staffId: '',
    fullName: '',
    email: '',
    role: 'trainer' as 'trainer' | 'admin',
  });

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    const staff = localStorage.getItem('staffData');

    if (!token || !staff) {
      router.push('/');
      return;
    }

    const staffInfo = JSON.parse(staff);
    
    if (staffInfo.role !== 'superadmin') {
      router.push('/dashboard/staff');
      return;
    }

    setStaffData(staffInfo);
    loadStaff();
  }, [router]);

  const loadStaff = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const response = await axios.get(`${API_URL}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStaffMembers(response.data.data);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      setMessage({ type: 'error', text: 'Failed to load staff members' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('staffToken');
      const response = await axios.post(`${API_URL}/api/staff/create`, {
        staffId: formData.staffId,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Staff member added successfully!' });
        setFormData({ staffId: '', fullName: '', email: '', role: 'trainer' });
        setShowAddForm(false);
        loadStaff();
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add staff member' 
      });
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm(`Are you sure you want to remove ${staffId}?`)) return;

    try {
      const token = localStorage.getItem('staffToken');
      await axios.delete(`${API_URL}/api/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: 'Staff member removed successfully' });
      loadStaff();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to remove staff member' 
      });
    }

    setTimeout(() => setMessage(null), 5000);
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

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/staff')}
            className="flex items-center gap-2 text-[#a3a3a3] hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            Staff Management
          </h1>
          <p className="text-[#a3a3a3]">Add and manage trainers and admins</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 rounded-lg p-4 flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Add Staff Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-lg transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Add New Staff
          </button>
        </div>

        {/* Add Staff Form */}
        {showAddForm && (
          <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-heading font-bold text-white mb-4">
              Add Staff Member
            </h2>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
                    Staff ID *
                  </label>
                  <input
                    type="text"
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value.toUpperCase() })}
                    placeholder="Staff ID"
                    className="w-full px-4 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-[#737373]">Format: S[Type]EA[Code][Role]</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Full Name"
                    className="w-full px-4 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@spatialcollective.com"
                  className="w-full px-4 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'trainer' | 'admin' })}
                  className="w-full px-4 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                >
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Add Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ staffId: '', fullName: '', email: '', role: 'trainer' });
                  }}
                  className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Staff List */}
        <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-xl font-heading font-bold text-white">
              Staff Members ({staffMembers.length})
            </h2>
          </div>

          {staffMembers.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-[#737373] mx-auto mb-4" />
              <p className="text-[#a3a3a3] mb-2">No staff members yet</p>
              <p className="text-sm text-[#737373]">Click "Add New Staff" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2a2a2a]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">Staff ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase">Created By</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {staffMembers.map((staff) => (
                    <tr key={staff.staff_id} className="hover:bg-[#2a2a2a]/50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-white">{staff.staff_id}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#e5e5e5]">{staff.full_name}</td>
                      <td className="px-6 py-4 text-sm text-[#e5e5e5]">{staff.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          staff.role === 'superadmin' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : staff.role === 'admin' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#a3a3a3]">{staff.created_by || 'System'}</td>
                      <td className="px-6 py-4 text-right">
                        {staff.role !== 'superadmin' && (
                          <button
                            onClick={() => handleDeleteStaff(staff.staff_id)}
                            className="text-red-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
