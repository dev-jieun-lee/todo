// DB와 연관된 휴가 타입 중심
export interface VacationDetail {
  id: number;
  user_id: number;
  username: string;
  name: string;
  type_code: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  duration_unit: string;
  status: string;
  reason?: string;
  created_at?: string;
  approved_by?: number;
  approved_at?: string;
  approver_username?: string;
  approver_name?: string;
  approver_dept?: string;
  approver_position?: string;
}

export interface VacationApproval {
  id: number;
  vacation_id: number;
  approver_id: number;
  step: number;
  status: "APPROVED" | "REJECTED";
  approved_at: string;
  memo?: string;
}

export interface VacationWithHistory extends VacationDetail {
  approvals: VacationApproval[];
}

export interface ApprovalVacation extends VacationDetail {
  target_type: string;
  target_id: number;
  requester_id: number;
  approver_id: number;
  step: number;
  order_no?: number;
  memo?: string;
  approved_at?: string;
  due_date?: string;
  is_final?: number;
}
