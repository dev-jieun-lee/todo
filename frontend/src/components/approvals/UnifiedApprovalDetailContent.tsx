import type { ApprovalData, VacationDetailData } from "../../types/approval";
import VacationDetailContent from "./detailForms/VacationDetailContent";
import UnsupportedDetailContent from "./detailForms/UnsupportedDetailContent";

interface UnifiedApprovalDetailContentProps {
  targetType: string;
  data: ApprovalData | VacationDetailData;
  commonCodeMap: Record<string, { code: string; label: string }[]>;
}

function isVacationDetailData(data: unknown): data is VacationDetailData {
  return (
    typeof data === "object" &&
    data !== null &&
    "approvers" in data &&
    "snapshot_name" in data
  );
}

export default function UnifiedApprovalDetailContent({
  targetType,
  data,
  commonCodeMap,
}: UnifiedApprovalDetailContentProps) {
  console.log("🧪 targetType:", targetType);
  console.log("🧾 data received in UnifiedApprovalDetailContent:", data);
  console.log("🧪 isVacationDetailData result:", isVacationDetailData(data));

  switch (targetType) {
    case "VACATION":
      if (isVacationDetailData(data)) {
        return (
          <VacationDetailContent
            data={data}
            approvers={data.approvers}
            commonCodeMap={commonCodeMap}
          />
        );
      }
      return <UnsupportedDetailContent />;
    default:
      return <UnsupportedDetailContent />;
  }
}
