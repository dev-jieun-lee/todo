// src/pages/approvals/RequestedPage.tsx
import ApprovalTabPanel from "../../components/approvals/ApprovalTabPanel";

export default function RequestedPage() {
  return (
    <ApprovalTabPanel
      title="📝 내가 요청한 항목"
      fetchUrl="/approvals/requested-by-me"
      showActions={false} // 요청자는 승인/반려 버튼 필요 없음
    />
  );
}
