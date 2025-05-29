//휴가 신청 form 상태
export interface VacationFormState {
  type_code: string;
  start_date: string;
  end_date: string;
  reason: string;
  half_day_type: string;
  time_shift_range: string;
  start_time: string;
  end_time: string;
  duration_unit: string;
}
