'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

interface ContractProgress {
  contracted_days: number;
  days_worked: number;
  days_remaining: number;
  percent_complete: number;
}

interface DailyRecord {
  date: string;
  attended: boolean;
  earning_status: 'earned' | 'not_earned';
  total_pay_kes: number;
  pay_note: string | null;
}

interface WorkHistoryEntry {
  date: string;
  output: number;
  target: number;
  target_met: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

type DayStatus = 'earned' | 'attended_not_earned' | 'absent' | 'future' | 'unknown';

interface CalendarDay {
  dayNumber: number; // 1–20 (contract day)
  date: string | null; // ISO date string or null if not reached
  status: DayStatus;
  pay_kes: number;
  note: string | null;
}

const STATUS_STYLES: Record<DayStatus, string> = {
  earned: 'bg-green-500/20 border-green-500/40 text-green-400',
  attended_not_earned: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
  absent: 'bg-[#dc2626]/20 border-[#dc2626]/40 text-[#dc2626]',
  future: 'bg-[#111111] border-[#262626] text-[#737373]',
  unknown: 'bg-[#111111] border-[#262626] text-[#737373]',
};

const STATUS_LABELS: Record<DayStatus, string> = {
  earned: 'Paid',
  attended_not_earned: 'Present',
  absent: 'Absent',
  future: '—',
  unknown: '?',
};

export default function DaysPage() {
  const router = useRouter();
  const [contractProgress, setContractProgress] = useState<ContractProgress | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) { router.replace('/'); return; }

    let user: { userId: string };
    try { user = JSON.parse(userData); } catch { router.replace('/'); return; }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      fetch(`/api/users/${user.userId}/performance`, { headers }).then((r) => r.json()),
      fetch(`/api/users/${user.userId}/payments`, { headers }).then((r) => r.json()),
    ]).then(([perfRes, payRes]) => {
      let cp: ContractProgress | null = null;
      let dailyRecords: DailyRecord[] = [];
      let workHistory: WorkHistoryEntry[] = [];

      if (perfRes.status === 'fulfilled' && perfRes.value.success) {
        cp = perfRes.value.data.contract_progress;
        workHistory = perfRes.value.data.work_history ?? [];
        setContractProgress(cp);
      } else {
        setError('Unable to load contract data. Please try again later.');
      }

      if (payRes.status === 'fulfilled' && payRes.value.success) {
        dailyRecords = payRes.value.data.daily_records ?? [];
      }

      // Build calendar days
      if (cp && dailyRecords.length > 0) {
        setCalendarDays(buildCalendar(cp, dailyRecords, workHistory));
      } else if (cp) {
        // No payment records yet — build from work_history only
        setCalendarDays(buildCalendarFromHistory(cp, workHistory));
      }

      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#dc2626]" />
      </div>
    );
  }

  const daysWorked = contractProgress?.days_worked ?? 0;
  const contractedDays = contractProgress?.contracted_days ?? 20;
  const daysRemaining = contractProgress?.days_remaining ?? contractedDays;

  return (
    <div className="bg-black px-4 pt-8 pb-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white font-heading mb-1">Attendance</h1>
        <p className="text-[#737373] text-sm mb-6">Your {contractedDays}-day contract calendar</p>

        {error && (
          <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-xl p-4 mb-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#dc2626]">{error}</p>
          </div>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Days Worked', value: daysWorked, color: 'text-green-400' },
            { label: 'Remaining', value: daysRemaining, color: 'text-white' },
            { label: 'Contract', value: contractedDays, color: 'text-[#737373]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#111111] border border-[#262626] rounded-xl p-3 text-center">
              <p className={`text-xl font-bold font-heading ${color}`}>{value}</p>
              <p className="text-[#737373] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-5 flex-wrap">
          {[
            { status: 'earned' as DayStatus, label: 'Paid' },
            { status: 'attended_not_earned' as DayStatus, label: 'Present, unpaid' },
            { status: 'absent' as DayStatus, label: 'Absent' },
            { status: 'future' as DayStatus, label: 'Upcoming' },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border ${STATUS_STYLES[status]}`} />
              <span className="text-[#737373] text-xs">{label}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {calendarDays.length > 0 ? (
          <div className="grid grid-cols-5 gap-2 mb-6">
            {calendarDays.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setSelectedDay(selectedDay?.dayNumber === day.dayNumber ? null : day)}
                className={`border rounded-xl p-2 flex flex-col items-center gap-0.5 transition-all active:scale-95 ${STATUS_STYLES[day.status]} ${selectedDay?.dayNumber === day.dayNumber ? 'ring-2 ring-white/30' : ''}`}
              >
                <span className="text-[10px] font-medium opacity-60">Day</span>
                <span className="text-lg font-bold font-heading leading-none">{day.dayNumber}</span>
                <span className="text-[9px] font-medium leading-none mt-0.5">{STATUS_LABELS[day.status]}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-[#111111] border border-[#262626] rounded-2xl p-8 text-center mb-6">
            <p className="text-[#737373] text-sm">
              {contractProgress
                ? 'No attendance records yet. Check back after your first work day.'
                : 'Contract information not available yet.'}
            </p>
          </div>
        )}

        {/* Day detail card */}
        {selectedDay && (
          <div className={`border rounded-2xl p-5 mb-4 ${STATUS_STYLES[selectedDay.status]}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-lg font-heading">Day {selectedDay.dayNumber}</p>
                {selectedDay.date && (
                  <p className="text-sm opacity-70">
                    {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-KE', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </p>
                )}
              </div>
              <span className="text-sm font-semibold bg-black/20 rounded-lg px-3 py-1">
                {STATUS_LABELS[selectedDay.status]}
              </span>
            </div>
            {selectedDay.pay_kes > 0 && (
              <p className="text-sm font-medium">Earnings: KES {selectedDay.pay_kes.toLocaleString()}</p>
            )}
            {selectedDay.note && (
              <p className="text-sm opacity-70 mt-1">{selectedDay.note}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildCalendar(
  cp: ContractProgress,
  dailyRecords: DailyRecord[],
  workHistory: WorkHistoryEntry[]
): CalendarDay[] {
  const contractedDays = cp.contracted_days || 20;

  // Build map: date string → payment record
  const payMap = new Map<string, DailyRecord>();
  for (const r of dailyRecords) payMap.set(r.date, r);

  // Build map: date string → work history entry
  const histMap = new Map<string, WorkHistoryEntry>();
  for (const h of workHistory) histMap.set(h.date, h);

  // Collect all known dates in order
  const allDates = Array.from(
    new Set([...payMap.keys(), ...histMap.keys()])
  ).sort();

  const today = new Date().toISOString().slice(0, 10);

  const days: CalendarDay[] = [];

  for (let i = 1; i <= contractedDays; i++) {
    const date = allDates[i - 1] ?? null;

    if (!date) {
      days.push({ dayNumber: i, date: null, status: 'future', pay_kes: 0, note: null });
      continue;
    }

    const payRec = payMap.get(date);
    const histRec = histMap.get(date);

    let status: DayStatus = 'unknown';
    let pay_kes = 0;
    let note: string | null = null;

    if (date > today) {
      status = 'future';
    } else if (payRec) {
      pay_kes = payRec.total_pay_kes;
      note = payRec.pay_note;
      if (payRec.earning_status === 'earned') status = 'earned';
      else if (payRec.attended) status = 'attended_not_earned';
      else status = 'absent';
    } else if (histRec) {
      if (histRec.status === 'approved') {
        status = histRec.target_met ? 'earned' : 'attended_not_earned';
        pay_kes = 0;
      } else if (histRec.status === 'pending') {
        status = 'attended_not_earned';
      } else {
        status = 'absent';
      }
    }

    days.push({ dayNumber: i, date, status, pay_kes, note });
  }

  return days;
}

function buildCalendarFromHistory(cp: ContractProgress, workHistory: WorkHistoryEntry[]): CalendarDay[] {
  const contractedDays = cp.contracted_days || 20;
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...workHistory].sort((a, b) => a.date.localeCompare(b.date));

  const days: CalendarDay[] = [];
  for (let i = 1; i <= contractedDays; i++) {
    const h = sorted[i - 1];
    if (!h) {
      days.push({ dayNumber: i, date: null, status: 'future', pay_kes: 0, note: null });
      continue;
    }
    let status: DayStatus = 'unknown';
    if (h.date > today) status = 'future';
    else if (h.status === 'approved') status = h.target_met ? 'earned' : 'attended_not_earned';
    else if (h.status === 'pending') status = 'attended_not_earned';
    else status = 'absent';

    days.push({ dayNumber: i, date: h.date, status, pay_kes: 0, note: null });
  }
  return days;
}
