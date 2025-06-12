import { useEffect, useState } from "react";
import ApprovalTabPanel from "../../components/approvals/ApprovalTabPanel";
import UnifiedApprovalDetailInlineView from "../../components/approvals/UnifiedApprovalDetailInlineView";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import type { ApprovalItem } from "../../types/approval";
// import useCommonCodeMap from "../../hooks/useCommonCodeMap";
import { useCommonCodeMap } from "../../contexts/CommonCodeContext";

import { useUser } from "../../contexts/useUser";
export default function RequestedPage() {
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const { id } = useUser();
  const commonCodeMap = useCommonCodeMap();
  useEffect(() => {
    api
      .get(`/approvals/requested-by-me`)
      .then((res) => {
        if (res.data.length > 0) {
          setSelectedItem(res.data[res.data.length - 1]);
        } else {
          setSelectedItem(null);
        }
      })
      .catch(() => toast.error("요청한 문서 목록을 불러오지 못했습니다."));
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="md:w-1/2">
        <ApprovalTabPanel
          title="📝 내가 요청한 항목"
          fetchUrl="/approvals/requested-by-me"
          showActions={false} // 요청자는 승인/반려 버튼 필요 없음
          onSelect={(item: ApprovalItem) => setSelectedItem(item)}
          keyExtractor={(item) => item.id}
          currentUserId={id ?? 0} // undefined라면 0 등으로 대체
        />
      </div>
      <div className="md:w-1/2">
        {selectedItem ? (
          <UnifiedApprovalDetailInlineView
            targetType={selectedItem.targetType}
            targetId={selectedItem.targetId}
            commonCodeMap={commonCodeMap}
            showActions={false}
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
