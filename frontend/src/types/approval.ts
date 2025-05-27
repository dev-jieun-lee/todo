//결재 흐름과 카드 요약 전용
export interface VacationSummary {
  start_date: string;
  end_date: string;
  type_label: string;
}

export interface KpiData {
  goal_title: string;
  period: string;
}

export interface TodoData {
  title: string;
  assignee: string;
}

export interface NoticeData {
  title: string;
  target_label: string;
}

export interface ProjectData {
  name: string;
  start_date: string;
}

export interface TransferData {
  from_department: string;
  to_department: string;
}

export interface DocumentData {
  title: string;
  doc_type: string;
}

export type ApprovalData =
  | VacationSummary
  | KpiData
  | TodoData
  | NoticeData
  | ProjectData
  | TransferData
  | DocumentData;

export interface ApprovalCardProps {
  targetType: string;
  targetId: number;
  requesterName: string;
  createdAt: string;
  dueDate?: string;
  data: ApprovalData;
  onApprove?: () => void; // 선택적으로
  onReject?: (memo: string) => void;
  showActions?: boolean;
  onClick?: (props: ApprovalCardProps) => void;
}

export interface ApprovalItem {
  id: number;
  targetType: string;
  targetId: number;
  requesterName: string;
  createdAt: string;
  dueDate?: string;
  data: ApprovalData;
}

export type ApprovalListItem = ApprovalItem;
export type ApprovalDetail = ApprovalItem;

export interface ApprovalHistoryItem {
  step: number;
  action: string; // APPROVED, REJECTED, SKIPPED 등
  memo?: string;
  actor_name: string;
  performed_at: string;
}

// 휴가 상세 보기용 데이터 타입 (결재 상세용)
export interface VacationDetailData {
  created_at?: string;
  snapshot_department_label?: string;
  employee_number?: string;
  snapshot_position_label?: string;
  snapshot_department_code: string;
  snapshot_position_code: string;
  snapshot_name?: string;
  start_date?: string;
  end_date?: string;
  type_label?: string;
  reason?: string;
  note?: string;
  type_code: string;
  approvers: {
    manager?: string;
    partLead?: string;
    teamLead?: string;
    deptHead?: string;
    ceo?: string;
  };
}
