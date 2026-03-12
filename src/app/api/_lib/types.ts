// Learn Platform — Types (v2)
// All user identity comes from DPW App. Learn only owns training, notifications, and QGIS submissions.

// === DPW User Profile (returned by DPW auth & user endpoints) ===

export interface UserProfile {
  user_id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  role: 'youth' | 'trainer' | 'admin';
  settlement: string | null;
  module: string | null;
  module_assignment: string | null;
  trainer_id: string | null;
  trainer_name: string | null;
  cohort: string | null;
  is_active: boolean;
  enrolled_at: string | null;
  contract: {
    has_signed: boolean;
    signed_at: string | null;
    start_date: string | null;
    end_date: string | null;
    total_contracted_days: number | null;
  } | null;
}

export interface AdminProfile {
  user_id: string;
  full_name: string;
  email: string;
  role: 'trainer' | 'admin';
  settlement: string | null;
  permissions: string[];
  is_active: boolean;
}

// === User List ===

export interface UserListItem {
  user_id: string;
  full_name: string;
  role: string;
  settlement: string | null;
  module: string | null;
  module_assignment: string | null;
  is_active: boolean;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface UserListResponse {
  users: UserListItem[];
  pagination: Pagination;
}

// === Attendance (from DPW) ===

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'excused';
  submitted_by: string;
  submitted_at: string;
  notes: string | null;
}

export interface AttendanceResponse {
  user_id: string;
  total_days_attended: number;
  date_range: { from: string; to: string };
  records: AttendanceRecord[];
}

// === Performance (from DPW) ===

export interface PerformanceSummary {
  total_days_worked: number;
  total_output: number;
  output_unit: string;
  daily_target: number;
  average_daily_output: number;
  best_day_output: number;
  target_met_days: number;
  attendance_rate: number;
}

export interface ContractProgress {
  contracted_days: number;
  days_worked: number;
  days_remaining: number;
  percent_complete: number;
}

export interface WorkHistoryEntry {
  date: string;
  output: number;
  target: number;
  target_met: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PerformanceResponse {
  user_id: string;
  module: string;
  summary: PerformanceSummary;
  contract_progress: ContractProgress;
  work_history: WorkHistoryEntry[];
}

// === Payments (from DPW v4) ===

export interface DailyPaymentRecord {
  date: string;
  module: string;
  volume: number;
  volume_unit: string;
  quality_score: number | null;
  quality_percentage: number | null;
  base_pay_kes: number;
  bonus_pay_kes: number;
  total_pay_kes: number;
  attended: boolean;
  day_type: string;
  earning_status: 'earned' | 'not_earned';
  pay_note: string | null;
  finalized: boolean;
}

export interface PaymentSummaryByModule {
  days_recorded: number;
  days_with_earnings: number;
  total_earnings_kes: number;
  total_base_pay_kes: number;
  total_bonus_pay_kes: number;
  avg_quality_percentage: number | null;
}

export interface PaymentsResponseV4 {
  user_id: string;
  full_name: string;
  module: string | null;
  period: { from: string; to: string };
  modules_active: string[];
  summary: {
    total_earnings_kes: number;
    total_base_pay_kes: number;
    total_bonus_pay_kes: number;
    days_with_earnings: number;
    by_module: Record<string, PaymentSummaryByModule>;
  };
  daily_records: DailyPaymentRecord[];
  sync_info: {
    microtasking_last_consensus: string | null;
    data_note: string | null;
  };
}

/** @deprecated Use PaymentsResponseV4 */
export type PaymentsResponse = PaymentsResponseV4;

// === Reference Data (from DPW) ===

export interface Settlement {
  settlement_id: string;
  name: string;
  full_name: string;
  region: string;
  is_active: boolean;
}

export interface Module {
  module_id: string;
  name: string;
  description: string;
  daily_target: number;
  payment_rate_kes: number;
  output_unit: string;
  is_active: boolean;
  settlements: string[];
}

export interface Trainer {
  trainer_id: string;
  full_name: string;
  email: string;
  settlement: string;
  module: string;
  youth_count: number;
  is_active: boolean;
}

// === DPW API Envelope ===

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// === Learn JWT Payload ===

export interface LearnTokenPayload {
  userId: string;
  fullName: string;
  role: 'youth' | 'trainer' | 'admin';
  settlement: string | null;
  module: string | null;
  moduleAssignment: string | null;
  userType: 'youth' | 'staff';
}

export type UserRole = 'youth' | 'trainer' | 'admin';
export type UserType = 'youth' | 'staff';
