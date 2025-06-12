//결재 흐름과 카드 요약 전용

export type ApproverInfo = {
  name: string;
  id: number;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
  approvedAt?: string; // 승인 일시
  proxy_type?: "ORIGINAL" | "PROXY" | "DELEGATE" | "SKIP"; // 추가
  proxy_role?: string; // 전결 시 실제 결재자 역할 코드
};

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
  onApprove?: () => void;
  onReject?: (memo: string) => void;
  onClick?: (props: ApprovalCardProps) => void;

  approval: {
    status: string;
    step: number;
    approver_id: number;
  };
  currentUserId: number;
  showActions?: boolean;
}

export interface ApprovalItem {
  currentApproverId: number | undefined;
  id: number;
  targetType: string;
  targetId: number;
  requesterName: string;
  createdAt: string;
  dueDate?: string;
  data: ApprovalData;
  status: string;
  step: number;
  approver_id: number;
}

export type ApprovalListItem = ApprovalItem;
export type ApprovalDetail = ApprovalItem;

export interface ApprovalHistoryItem {
  step: number;
  action: string;
  memo: string;
  actor_id: number;
  actor_name: string;
  performed_at: string;
  position_label?: string;
  department_label?: string;
}

// 휴가 상세 보기용 데이터 타입 (결재 상세용)
export interface VacationDetailData {
  id?: number;
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
    manager?: ApproverInfo;
    partLead?: ApproverInfo;
    teamLead?: ApproverInfo;
    deptHead?: ApproverInfo;
    ceo?: ApproverInfo;
    [key: string]: ApproverInfo | undefined;
  };
  currentApproverId?: number;
  approverIds?: {
    manager?: number;
    partLead?: number;
    teamLead?: number;
    deptHead?: number;
    ceo?: number;
    [key: string]: number | undefined;
  };
}
