export type EmploymentType = 'parttime' | 'fulltime'
export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  full_name: string
  type: EmploymentType
  role: UserRole
  viatico: number
  extra_rate: number
  employee_code?: string
  working_days: number[]
  created_at: string
}

export interface TimeEntry {
  id: string
  user_id: string
  date: string
  start_time: string
  end_time: string
  slot_index?: number
  concept: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Period {
  id: string
  name: string
  start_date: string
  end_date: string
  is_locked: boolean
  created_by: string
  created_at: string
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  approval_note?: string
}

export interface DayCalculation {
  date: string
  start_time: string
  scheduled_end_time: string
  end_time: string
  concept: string
  hours: number
  standard_hours: number
  extra_hours: number
  extra_time: string
  viatico: number
  viatico_amount: number
  // Recargos legales
  regular_hours: number
  night_hours: number
  sunday_hours: number
  holiday_hours: number
  night_surcharge: number
  sunday_surcharge: number
  holiday_surcharge: number
  is_sunday: boolean
  is_holiday: boolean
  holiday_name?: string
}

export interface PeriodSummary {
  days: DayCalculation[]
  total_hours: number
  total_extra_hours: number
  total_viatico: number
  days_with_viatico: number
}

// ── Countries / Policy / Holidays ─────────────────────────────

export interface Country {
  id: string
  name: string
  code: string
}

export interface PolicyConfig {
  id: string
  country_id: string
  night_start: string
  night_end: string
  night_surcharge_pct: number
  sunday_surcharge_pct: number
  holiday_surcharge_pct: number
  extra_threshold_minutes: number
  rounding_block_minutes: number
  currency: string
  multi_entry_enabled: boolean
}

export interface Holiday {
  id: string
  country_id: string
  date: string
  name: string
}

// ── Absences ─────────────────────────────────────────────

export type AbsenceType = 'vacation' | 'sick' | 'compensatory'
export type AbsenceStatus = 'pending' | 'approved' | 'rejected'

export interface Absence {
  id: string
  user_id: string
  type: AbsenceType
  start_date: string
  end_date: string
  reason?: string
  status: AbsenceStatus
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

// ── Notifications ────────────────────────────────────────

export type NotificationType = 'absence_request' | 'absence_approved' | 'absence_rejected' | 'period_approval' | 'period_approved' | 'period_rejected' | 'shift_swap' | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  is_read: boolean
  created_at: string
}

// ── Shift Swaps ──────────────────────────────────────────

export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface ShiftSwap {
  id: string
  requester_id: string
  target_id: string
  date: string
  requester_shift?: string
  target_shift?: string
  reason?: string
  status: SwapStatus
  responded_at?: string
  created_at: string
}
