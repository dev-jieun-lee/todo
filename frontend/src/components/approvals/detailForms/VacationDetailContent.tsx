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
  return (
    <VacationDetailView
      data={data}
      approvers={approvers}
      commonCodeMap={commonCodeMap}
    />
  );
}
