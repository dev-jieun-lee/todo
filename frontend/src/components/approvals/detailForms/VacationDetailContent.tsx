// VacationDetailContent.tsx 개선 버전
import VacationDetailView from "./VacationDetailView";
import type { VacationDetailData, ApproverInfo } from "../../../types/approval";

interface Props {
  data: VacationDetailData;
  approvers: Record<string, string | ApproverInfo | undefined>;
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
  // approvers.step1, step2 → 항상 ApproverInfo 객체로 변환
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
      //approverIds={data.approverIds}
      approvers={mappedApprovers}
      commonCodeMap={commonCodeMap}
    />
  );
}
