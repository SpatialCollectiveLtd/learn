'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  UserCheck, 
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardList,
  User,
  Phone,
  X,
  Trash2
} from 'lucide-react';

interface Youth {
  youth_id: string;
  full_name: string;
  phone_number: string | null;
  program_type: string;
  settlement?: string;
}

interface AttendanceRecord {
  id: number;
  youth_id: string;
  full_name: string;
  attendance_date: string;
  submitted_at: string;
  submitted_by: string;
  notes: string | null;
}

export default function StaffAttendancePage() {
  const router = useRouter();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffName, setStaffName] = useState('');
  
  // Module selection state
  const [selectedModule, setSelectedModule] = useState('mobile_mapping');
  
  // Settlement filter state
  const [selectedSettlement, setSelectedSettlement] = useState('all');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Youth[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Selected youth state
  const [selectedYouth, setSelectedYouth] = useState<Youth | null>(null);
  
  // Form state
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Today's attendance state
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [totalMappers, setTotalMappers] = useState(0);
  const [loadingRecords, setLoadingRecords] = useState(true);
  
  // Delete state
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Module display names
  const moduleNames: Record<string, string> = {
    mobile_mapping: 'Mobile Mapping',
    digitization: 'Digitization',
    microtasking: 'Microtasking',
    household_survey: 'Household Survey'
  };

  // Settlement display names and prefixes
  const settlements = [
    { value: 'all', label: 'All Settlements', prefix: '' },
    { value: 'kayole', label: 'Kayole Soweto', prefix: 'KAY' },
    { value: 'huruma', label: 'Mji wa Huruma', prefix: 'HUR' },
    { value: 'kariobangi', label: 'Kariobangi Machakos', prefix: 'KAR' }
  ];

  // Check auth on mount - allow trainer, admin, and superadmin
  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    const staffData = localStorage.getItem('staffData');
    
    if (!token || !staffData) {
      router.push('/');
      return;
    }
    
    try {
      const parsed = JSON.parse(staffData);
      // Allow trainer, admin, and superadmin roles
      const allowedRoles = ['trainer', 'admin', 'superadmin'];
      if (!allowedRoles.includes(parsed.role)) {
        router.push('/');
        return;
      }
      setStaffName(parsed.fullName || parsed.name || parsed.staffId);
      setIsAuthenticated(true);
      fetchTodayAttendance();
    } catch {
      router.push('/');
    }
  }, [router]);

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    setLoadingRecords(true);
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch(`/api/staff/attendance?date=${attendanceDate}&module=${selectedModule}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Handle auth errors
      if (response.status === 401) {
        console.error('Authentication failed - redirecting to login');
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffData');
        router.push('/');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        // Filter records by settlement if not 'all'
        let records = data.data.records;
        if (selectedSettlement !== 'all') {
          const settlement = settlements.find(s => s.value === selectedSettlement);
          if (settlement && settlement.prefix) {
            records = records.filter((r: AttendanceRecord) => 
              r.youth_id.startsWith(settlement.prefix)
            );
          }
        }
        
        setTodayRecords(records);
        setAttendanceCount(records.length);
        setTotalMappers(data.data.total_mappers);
      } else if (data.message?.includes('token')) {
        // Token error - redirect to login
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffData');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Fetch attendance when date, module, or settlement changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchTodayAttendance();
      // Clear selected youth when module changes
      setSelectedYouth(null);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [attendanceDate, selectedModule, selectedSettlement, isAuthenticated]);

  // Search youth
  const searchYouth = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const token = localStorage.getItem('staffToken');
      console.log('Searching for:', query, 'with token:', token ? 'present' : 'missing');
      const response = await fetch(`/api/staff/attendance/search?q=${encodeURIComponent(query)}&module=${selectedModule}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Search response status:', response.status);
      const data = await response.json();
      console.log('Search response data:', data);
      
      if (data.success) {
        setSearchResults(data.data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }, [selectedModule]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchYouth(searchQuery);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, searchYouth]);

  // Select youth
  const handleSelectYouth = (youth: Youth) => {
    setSelectedYouth(youth);
    setSearchQuery('');
    setSearchResults([]);
    setSubmitMessage(null);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedYouth(null);
    setNotes('');
    setSubmitMessage(null);
  };
  // Delete attendance record
  const deleteAttendanceRecord = async (recordId: number, youthName: string) => {
    if (!confirm(`Are you sure you want to delete the attendance record for ${youthName}? This action cannot be undone.`)) {
      return;
    }

    setDeletingRecordId(recordId);
    setDeleteMessage(null);
    
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch(`/api/staff/attendance?id=${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDeleteMessage({ type: 'success', text: data.message });
        // Refresh the attendance list
        fetchTodayAttendance();
        // Clear message after 5 seconds
        setTimeout(() => setDeleteMessage(null), 5000);
      } else {
        setDeleteMessage({ type: 'error', text: data.message || 'Failed to delete attendance record' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setDeletingRecordId(null);
    }
  };
  // Submit attendance
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYouth) return;
    
    setSubmitting(true);
    setSubmitMessage(null);
    
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          youth_id: selectedYouth.youth_id,
          attendance_date: attendanceDate,
          notes: notes || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitMessage({ type: 'success', text: `Attendance recorded for ${selectedYouth.full_name}` });
        clearSelection();
        fetchTodayAttendance();
      } else {
        setSubmitMessage({ type: 'error', text: data.message || 'Failed to record attendance' });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header - Mobile responsive */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#a3a3a3] hover:text-primary mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-3xl font-heading font-bold text-white flex items-center gap-2 sm:gap-3">
                <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                Attendance Sheet
              </h1>
              <p className="text-[#a3a3a3] mt-1 text-sm sm:text-base">{moduleNames[selectedModule]} - Daily Attendance</p>
            </div>
            <div className="text-left sm:text-right bg-[#1a1a1a] sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
              <p className="text-xs sm:text-sm text-[#a3a3a3]">Logged in as</p>
              <p className="text-white font-semibold text-sm sm:text-base">{staffName}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Mobile responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-white">{totalMappers}</p>
                <p className="text-xs text-[#a3a3a3] truncate">Total Mappers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="bg-success/20 p-2 rounded-lg flex-shrink-0">
                <UserCheck className="w-5 h-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-white">{attendanceCount}</p>
                <p className="text-xs text-[#a3a3a3] truncate">
                  {attendanceDate === new Date().toISOString().split('T')[0] ? 'Present Today' : 'Present on Date'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="bg-warning/20 p-2 rounded-lg flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-white">{totalMappers - attendanceCount}</p>
                <p className="text-xs text-[#a3a3a3] truncate">Not Recorded</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left: Attendance Form */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-heading font-bold text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Record Attendance
            </h2>

            {/* Success/Error Message */}
            {submitMessage && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                submitMessage.type === 'success' 
                  ? 'bg-success/10 border border-success/30 text-success' 
                  : 'bg-error/10 border border-error/30 text-error'
              }`}>
                {submitMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{submitMessage.text}</span>
              </div>
            )}

            {/* Delete Success/Error Message */}
            {deleteMessage && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                deleteMessage.type === 'success' 
                  ? 'bg-success/10 border border-success/30 text-success' 
                  : 'bg-error/10 border border-error/30 text-error'
              }`}>
                {deleteMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{deleteMessage.text}</span>
              </div>
            )}

            {/* Module Selector */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Select Module
              </label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-4 py-3 bg-[#262626] border-2 border-[#3a3a3a] rounded-lg text-white text-base font-medium focus:border-primary focus:outline-none hover:border-[#4a4a4a] transition-colors cursor-pointer"
              >
                <option value="mobile_mapping">Mobile Mapping</option>
                <option value="digitization">Digitization</option>
                <option value="microtasking">Microtasking</option>
                <option value="household_survey">Household Survey</option>
              </select>
            </div>

            {/* Settlement Filter */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Filter by Settlement
              </label>
              <select
                value={selectedSettlement}
                onChange={(e) => setSelectedSettlement(e.target.value)}
                className="w-full px-4 py-3 bg-[#262626] border-2 border-[#3a3a3a] rounded-lg text-white text-base font-medium focus:border-primary focus:outline-none hover:border-[#4a4a4a] transition-colors cursor-pointer"
              >
                {settlements.map(settlement => (
                  <option key={settlement.value} value={settlement.value}>
                    {settlement.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker with Quick Actions */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Select Date to View/Record
              </label>
              
              {/* Quick Date Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setAttendanceDate(new Date().toISOString().split('T')[0])}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    attendanceDate === new Date().toISOString().split('T')[0]
                      ? 'bg-primary text-white'
                      : 'bg-[#262626] text-[#a3a3a3] hover:bg-[#333] hover:text-white border border-[#3a3a3a]'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setAttendanceDate(yesterday.toISOString().split('T')[0]);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    attendanceDate === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]
                      ? 'bg-primary text-white'
                      : 'bg-[#262626] text-[#a3a3a3] hover:bg-[#333] hover:text-white border border-[#3a3a3a]'
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    setAttendanceDate(weekAgo.toISOString().split('T')[0]);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    attendanceDate === new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
                      ? 'bg-primary text-white'
                      : 'bg-[#262626] text-[#a3a3a3] hover:bg-[#333] hover:text-white border border-[#3a3a3a]'
                  }`}
                >
                  Last Week
                </button>
              </div>

              {/* Date Input with Better Styling */}
              <div className="relative">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-[#262626] border-2 border-[#3a3a3a] rounded-lg text-white text-base font-medium focus:border-primary focus:outline-none hover:border-[#4a4a4a] transition-colors cursor-pointer [color-scheme:dark]"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Calendar className="w-5 h-5 text-[#737373]" />
                </div>
              </div>
              
              <div className="mt-2 p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                <p className="text-xs text-[#a3a3a3] flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Viewing: <span className="text-white font-medium">
                    {new Date(attendanceDate + 'T12:00:00').toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              </div>
            </div>

            {/* Search or Selected Youth */}
            {!selectedYouth ? (
              <div className="mb-4">
                <label className="block text-sm text-[#a3a3a3] mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search by ID, Name, or Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter ID, name, or phone (e.g., KAY1799DM, John, 0712...)"
                    className="w-full px-4 py-3 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white placeholder-[#525252] focus:border-primary focus:outline-none pr-10"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-[#262626] border border-[#3a3a3a] rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                    {searchResults.map((youth) => (
                      <button
                        key={youth.youth_id}
                        onClick={() => handleSelectYouth(youth)}
                        className="w-full px-4 py-3 text-left hover:bg-[#333] transition-colors border-b border-[#3a3a3a] last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold flex items-center gap-2">
                              <User className="w-4 h-4 text-primary flex-shrink-0" />
                              {youth.full_name}
                            </p>
                            <p className="text-sm text-[#a3a3a3] mt-1">ID: {youth.youth_id}</p>
                            {youth.phone_number && (
                              <p className="text-sm text-[#a3a3a3] flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {youth.phone_number}
                              </p>
                            )}
                            {youth.settlement && (
                              <p className="text-xs text-[#737373] mt-1">{youth.settlement}</p>
                            )}
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-primary/50 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 3 && searchResults.length === 0 && !searching && (
                  <p className="mt-2 text-sm text-[#a3a3a3]">No participants found matching "{searchQuery}"</p>
                )}
              </div>
            ) : (
              /* Selected Youth Card */
              <div className="mb-4 bg-[#262626] border border-primary/30 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white">{selectedYouth.full_name}</h3>
                  <button 
                    onClick={clearSelection}
                    className="text-[#a3a3a3] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#a3a3a3]">
                    <User className="w-4 h-4" />
                    <span>ID: <span className="text-white font-medium">{selectedYouth.youth_id}</span></span>
                  </div>
                  {selectedYouth.phone_number && (
                    <div className="flex items-center gap-2 text-[#a3a3a3]">
                      <Phone className="w-4 h-4" />
                      <span className="text-white font-medium">{selectedYouth.phone_number}</span>
                    </div>
                  )}
                  {selectedYouth.settlement && (
                    <div className="flex items-center gap-2 text-[#a3a3a3]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-white font-medium">{selectedYouth.settlement}</span>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-[#3a3a3a]">
                    <p className="text-xs text-primary/80 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verify this information before submitting
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedYouth && (
              <div className="mb-4">
                <label className="block text-sm text-[#a3a3a3] mb-2">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className="w-full px-4 py-3 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white placeholder-[#525252] focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedYouth || submitting}
              className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Record Attendance
                </>
              )}
            </button>
          </div>

          {/* Right: Today's Attendance List */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-heading font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Attendance for {new Date(attendanceDate + 'T12:00:00').toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </h2>

            {loadingRecords ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : todayRecords.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-[#525252] mx-auto mb-3" />
                <p className="text-[#a3a3a3] font-medium mb-1">No attendance recorded</p>
                <p className="text-sm text-[#737373]">
                  {attendanceDate === new Date().toISOString().split('T')[0] 
                    ? `No one has been marked present today for ${moduleNames[selectedModule]}`
                    : `No attendance was recorded on this date for ${moduleNames[selectedModule]}`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {todayRecords.map((record, index) => (
                  <div 
                    key={record.id}
                    className="group flex items-center justify-between p-3 sm:p-4 bg-[#262626] hover:bg-[#2a2a2a] rounded-lg transition-all border border-transparent hover:border-primary/20"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-success/30 transition-colors">
                        <span className="text-success text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{record.full_name}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#a3a3a3]">{record.youth_id}</span>
                          {record.notes && (
                            <span className="text-[#737373] truncate max-w-[150px]">• {record.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <div className="text-right">
                        <p className="text-xs text-primary font-medium">
                          {new Date(record.submitted_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-[#737373]">
                          by {record.submitted_by}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteAttendanceRecord(record.id, record.full_name)}
                        disabled={deletingRecordId === record.id}
                        className="p-2 rounded-lg bg-error/10 hover:bg-error/20 text-error border border-error/30 hover:border-error/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete this attendance record"
                      >
                        {deletingRecordId === record.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
