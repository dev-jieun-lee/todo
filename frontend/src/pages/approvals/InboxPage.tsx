import ApprovalTabPanel from "../../components/approvals/ApprovalTabPanel";
import UnifiedApprovalDetailInlineView from "../../components/approvals/UnifiedApprovalDetailInlineView";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import type { ApprovalItem } from "../../types/approval";

export default function InboxPage() {
  const [refreshKey, setRefreshKey] = useState(Date.now());
  //const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);

  const reload = () => setRefreshKey(Date.now());
  useEffect(() => {
    api
      .get(`/approvals/pending-to-me?refreshKey=${refreshKey}`)
      .then((res) => {
        if (res.data.length > 0) {
          setSelectedItem(res.data[res.data.length - 1]);
        } else {
          setSelectedItem(null);
        }
      })
      .catch(() => toast.error("승인 목록 불러오기 실패"));
  }, [refreshKey]);

  const handleApprove = (type: string, id: number) => {
    api
      .post(`/approvals/${type.toLowerCase()}/${id}/approve`)
      .then(() => {
        toast.success("승인 완료");
        reload();
      })
      .catch((err) => {
        toast.error("승인 실패");
        console.error("❌ 승인 에러:", err);
      });
  };

  const handleReject = (type: string, id: number, memo: string) => {
    api
      .post(`/approvals/${type.toLowerCase()}/${id}/reject`, { memo })
      .then(() => {
        toast.success("반려 완료");
        reload();
      })
      .catch((err) => {
        toast.error("반려 실패");
        console.error("❌ 반려 에러:", err);
      });
  };
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="md:w-1/2">
        <ApprovalTabPanel
          title="📬 내가 승인할 항목"
          fetchUrl={`/approvals/pending-to-me?refreshKey=${refreshKey}`}
          showActions={true}
          onApprove={handleApprove}
          onReject={handleReject}
          onSelect={(item: ApprovalItem) => setSelectedItem(item)} // 상세 선택 연결
        />
      </div>
      <div className="md:w-1/2">
        {selectedItem ? (
          <UnifiedApprovalDetailInlineView
            targetType={selectedItem.targetType}
            targetId={selectedItem.targetId}
          />
        ) : (
          <p className="text-gray-500 text-sm">
            문서를 선택하면 상세 정보가 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
