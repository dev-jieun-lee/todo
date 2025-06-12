// VacationDetailContent.tsx 개선 버전
import VacationDetailView from "./VacationDetailView";
import type { VacationDetailData, ApproverInfo } from "../../../types/approval";

interface Props {
  data: VacationDetailData;
  approvers: Record<string, unknown>;
  commonCodeMap: Record<string, { code: string; label: string }[]>;
  isMyTurn?: boolean;
  currentUserId?: number;
  onApprove?: () => void;
  onReject?: (memo: string) => void;
}

function toApproverInfo(val: unknown): ApproverInfo | undefined {
  if (!val) return undefined;
  if (typeof val === "object" && val !== null && "name" in val && "id" in val)
    return val as ApproverInfo;
  if (typeof val === "string") return { name: val, id: -1 };
  return undefined;
}
export default function VacationDetailContent({
  data,
  approvers,
  commonCodeMap,
}: Props) {
  // approvalController에서 proxy_type, proxy_role이 내려온다고 가정
  const mappedApprovers = {
    manager: toApproverInfo(approvers.manager || approvers.step1),
    partLead: toApproverInfo(approvers.partLead || approvers.step2),
    teamLead: toApproverInfo(approvers.teamLead),
    deptHead: toApproverInfo(approvers.deptHead),
    ceo: toApproverInfo(approvers.ceo),
  };
  return (
    <VacationDetailView
      data={data}
      approvers={mappedApprovers}
      commonCodeMap={commonCodeMap}
    />
  );
}
