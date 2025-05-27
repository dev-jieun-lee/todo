import { useEffect, useState } from "react";
import ApprovalTabPanel from "../../components/approvals/ApprovalTabPanel";
import UnifiedApprovalDetailInlineView from "../../components/approvals/UnifiedApprovalDetailInlineView";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import type { ApprovalItem } from "../../types/approval";
import type { CommonCode } from "../../types/CommonCode";

export default function RequestedPage() {
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [commonCodeMap, setCommonCodeMap] = useState<
    Record<string, { code: string; label: string }[]>
  >({});

  useEffect(() => {
    api.get("/common-codes/all").then((res) => {
      const grouped: Record<string, { code: string; label: string }[]> = {};
      res.data.forEach((c: CommonCode) => {
        if (!grouped[c.group]) grouped[c.group] = [];
        grouped[c.group].push({ code: c.code, label: c.label });
      });
      setCommonCodeMap(grouped);
    });
  }, []);

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
        />
      </div>
      <div className="md:w-1/2">
        {selectedItem ? (
          <UnifiedApprovalDetailInlineView
            targetType={selectedItem.targetType}
            targetId={selectedItem.targetId}
            commonCodeMap={commonCodeMap}
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
