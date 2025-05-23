// src/types.ts

export interface Vacation {
  id: number;
  type_code: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  duration_unit: string;
  status: string;
  reason: string;
  created_at: string;
}
