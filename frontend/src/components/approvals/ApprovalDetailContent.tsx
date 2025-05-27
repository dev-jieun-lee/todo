//문서 타입 상관없이 단일한 상세 내용 렌더링 담당
import VacationDetailContent from "./detailForms/VacationDetailContent";
// import KpiDetailContent from "./detailForms/KpiDetailContent";
// import NoticeDetailContent from "./detailForms/NoticeDetailContent";
// import ProjectDetailContent from "./detailForms/ProjectDetailContent";
// import TransferDetailContent from "./detailForms/TransferDetailContent";
// import DocumentDetailContent from "./detailForms/DocumentDetailContent";
import UnsupportedDetailContent from "./detailForms/UnsupportedDetailContent";

import type {
  ApprovalData,
  VacationDetailData,
  // VacationSummary,
  // KpiData,
  // NoticeData,
  // ProjectData,
  // TransferData,
  // DocumentData,
} from "../../types/approval";

interface Props {
  targetType: string;
  data: ApprovalData;
  commonCodeMap: Record<string, { code: string; label: string }[]>;
}
export default function ApprovalDetailContent({
  targetType,
  data,
  commonCodeMap,
}: Props) {
  switch (targetType.toUpperCase()) {
    case "VACATION":
      return (
        <VacationDetailContent
          data={data as VacationDetailData}
          approvers={(data as VacationDetailData).approvers}
          commonCodeMap={commonCodeMap} // ✅ 전달
        />
      );
    // case "KPI":
    //   return <KpiDetailContent data={data} />;
    // case "NOTICE":
    //   return <NoticeDetailContent data={data} />;
    // case "PROJECT":
    //   return <ProjectDetailContent data={data} />;
    // case "TRANSFER":
    //   return <TransferDetailContent data={data} />;
    // case "DOCUMENT":
    //   return <DocumentDetailContent data={data} />;
    default:
      return <UnsupportedDetailContent />;
  }
}
