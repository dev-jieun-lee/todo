// VacationDetailContent.tsx 개선 버전
import VacationDetailView from "./VacationDetailView";
import type { VacationDetailData } from "../../../types/approval";

interface Props {
  data: VacationDetailData;
  approvers: VacationDetailData["approvers"];
  commonCodeMap: Record<string, { code: string; label: string }[]>;
}

export default function VacationDetailContent({
  data,
  approvers,
  commonCodeMap,
}: Props) {
  // approvers.step1, step2 를 역할 기반으로 변환 (확장 가능하게)
  const mappedApprovers = {
    manager: approvers.step1 || "",
    partLead: approvers.step2 || "",
    teamLead: approvers.teamLead || "",
    deptHead: approvers.deptHead || "",
    ceo: approvers.ceo || "",
  };

  return (
    <VacationDetailView
      data={data}
      approvers={mappedApprovers}
      commonCodeMap={commonCodeMap}
    />
  );
}
