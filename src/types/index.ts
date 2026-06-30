export type EmploymentType = 'partime' | 'fulltime'
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
}

export interface PeriodSummary {
  days: DayCalculation[]
  total_hours: number
  total_extra_hours: number
  total_viatico: number
  days_with_viatico: number
}
