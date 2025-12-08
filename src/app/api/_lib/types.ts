// Type definitions for the application

export interface StaffMember {
  staff_id: string;
  full_name: string;
  email: string | null;
  role: 'validator' | 'admin';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export interface YouthParticipant {
  youth_id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  program_type: 'digitization' | 'mobile_mapping' | 'household_survey' | 'microtasking';
  osm_username: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export interface ContractTemplate {
  template_id: string;
  program_type: 'digitization' | 'mobile_mapping' | 'household_survey' | 'microtasking';
  version: string;
  title: string;
  content: string;
  pdf_url: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SignedContract {
  contract_id: string;
  youth_id: string;
  template_id: string;
  signature_data: string;
  ip_address: string | null;
  user_agent: string | null;
  signed_at: Date;
  pdf_url: string | null;
  is_valid: boolean;
  invalidated_at: Date | null;
  invalidated_by: string | null;
  invalidation_reason: string | null;
}

export interface AuthLog {
  log_id: string;
  user_id: string;
  user_type: 'youth' | 'staff';
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  created_at: Date;
}

export interface YouthWithContract extends YouthParticipant {
  has_signed_contract: boolean;
  signed_at: Date | null;
  contract_id: string | null;
}

export interface ContractStatistics {
  program_type: string;
  total_participants: number;
  signed_contracts: number;
  unsigned_contracts: number;
}

export type ProgramType = 'digitization' | 'mobile_mapping' | 'household_survey' | 'microtasking';
export type UserRole = 'validator' | 'admin';
export type UserType = 'youth' | 'staff';
