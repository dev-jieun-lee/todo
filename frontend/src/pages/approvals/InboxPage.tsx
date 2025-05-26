import ApprovalTabPanel from "../../components/approvals/ApprovalTabPanel";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import { useState } from "react";

export default function InboxPage() {
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const reload = () => setRefreshKey(Date.now());

  return (
    <ApprovalTabPanel
      title="📬 내가 승인할 항목"
      fetchUrl={`/approvals/pending-to-me?refreshKey=${refreshKey}`} // 강제 리렌더
      showActions={true}
      onApprove={(type, id) => {
        api
          .post(`/approvals/${type.toLowerCase()}/${id}/approve`)
          .then(() => {
            toast.success("승인 완료");
            reload(); // 목록 다시 불러오기
          })
          .catch((err) => {
            toast.error("승인 실패");
            console.error("❌ 승인 에러:", err);
          });
      }}
      onReject={(type, id, memo) => {
        api
          .post(`/approvals/${type.toLowerCase()}/${id}/reject`, { memo })
          .then(() => {
            toast.success("반려 완료");
            reload(); // 목록 다시 불러오기
          })
          .catch((err) => {
            toast.error("반려 실패");
            console.error("❌ 반려 에러:", err);
          });
      }}
    />
  );
}
