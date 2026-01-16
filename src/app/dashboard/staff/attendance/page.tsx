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
  CreditCard,
  X
} from 'lucide-react';

interface Youth {
  youth_id: string;
  full_name: string;
  id_number: string | null;
  phone_number: string | null;
  program_type: string;
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
      const response = await fetch(`/api/staff/attendance?date=${attendanceDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setTodayRecords(data.data.records);
        setAttendanceCount(data.data.attendance_count);
        setTotalMappers(data.data.total_mappers);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Fetch attendance when date changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchTodayAttendance();
    }
  }, [attendanceDate, isAuthenticated]);

  // Search youth
  const searchYouth = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const token = localStorage.getItem('staffToken');
      const response = await fetch(`/api/staff/attendance/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }, []);

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
              <p className="text-[#a3a3a3] mt-1 text-sm sm:text-base">Mobile Mapping - Daily Attendance</p>
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
                <p className="text-xs text-[#a3a3a3] truncate">Present Today</p>
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

            {/* Date Picker */}
            <div className="mb-4">
              <label className="block text-sm text-[#a3a3a3] mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Attendance Date
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white focus:border-primary focus:outline-none"
              />
            </div>

            {/* Search or Selected Youth */}
            {!selectedYouth ? (
              <div className="mb-4">
                <label className="block text-sm text-[#a3a3a3] mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search by Unique ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    placeholder="Enter ID (e.g., KAY1799DM)"
                    className="w-full px-4 py-3 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white placeholder-[#525252] focus:border-primary focus:outline-none pr-10"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-[#262626] border border-[#3a3a3a] rounded-lg overflow-hidden">
                    {searchResults.map((youth) => (
                      <button
                        key={youth.youth_id}
                        onClick={() => handleSelectYouth(youth)}
                        className="w-full px-4 py-3 text-left hover:bg-[#333] transition-colors border-b border-[#3a3a3a] last:border-b-0"
                      >
                        <p className="text-white font-semibold">{youth.youth_id}</p>
                        <p className="text-sm text-[#a3a3a3]">{youth.full_name}</p>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 3 && searchResults.length === 0 && !searching && (
                  <p className="mt-2 text-sm text-[#a3a3a3]">No mappers found</p>
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
                    <span>ID: {selectedYouth.youth_id}</span>
                  </div>
                  {selectedYouth.id_number && (
                    <div className="flex items-center gap-2 text-[#a3a3a3]">
                      <CreditCard className="w-4 h-4" />
                      <span>National ID: {selectedYouth.id_number}</span>
                    </div>
                  )}
                  {selectedYouth.phone_number && (
                    <div className="flex items-center gap-2 text-[#a3a3a3]">
                      <Phone className="w-4 h-4" />
                      <span>{selectedYouth.phone_number}</span>
                    </div>
                  )}
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
              Attendance for {new Date(attendanceDate).toLocaleDateString('en-US', { 
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
                <p className="text-[#a3a3a3]">No attendance recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {todayRecords.map((record, index) => (
                  <div 
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-[#262626] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                        <span className="text-success text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{record.full_name}</p>
                        <p className="text-xs text-[#a3a3a3]">{record.youth_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#a3a3a3]">
                        {new Date(record.submitted_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
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
