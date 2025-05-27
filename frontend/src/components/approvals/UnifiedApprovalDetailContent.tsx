import type { ApprovalData, VacationDetailData } from "../../types/approval";
import VacationDetailContent from "./detailForms/VacationDetailContent";
import UnsupportedDetailContent from "./detailForms/UnsupportedDetailContent";

interface UnifiedApprovalDetailContentProps {
  targetType: string;
  data: ApprovalData | VacationDetailData;
  commonCodeMap: Record<string, { code: string; label: string }[]>; //
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
  commonCodeMap, //
}: UnifiedApprovalDetailContentProps) {
  console.log("🧪 targetType:", targetType);
  console.log("🧾 data received in UnifiedApprovalDetailContent:", data); // ✅ [2] 여기
  console.log("🧪 isVacationDetailData result:", isVacationDetailData(data)); // ✅ [3] 여기

  switch (targetType) {
    case "VACATION":
      if (isVacationDetailData(data)) {
        return (
          <VacationDetailContent
            data={data}
            approvers={data.approvers}
            commonCodeMap={commonCodeMap} // 전달
          />
        );
      }
      return <UnsupportedDetailContent />;
    default:
      return <UnsupportedDetailContent />;
  }
}
