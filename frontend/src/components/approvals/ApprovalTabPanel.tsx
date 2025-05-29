import { useEffect, useState } from "react";
import ApprovalCard from "./ApprovalCard";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import type { ApprovalItem, ApprovalListItem } from "../../types/approval";
import useCommonCodeMap from "../../hooks/useCommonCodeMap";

interface ApprovalTabPanelProps {
  title: string;
  fetchUrl: string;
  showActions?: boolean;
  onApprove?: (type: string, id: number) => void;
  onReject?: (type: string, id: number, memo: string) => void;
  onSelect?: (item: ApprovalItem) => void;
  keyExtractor?: (item: ApprovalListItem) => string | number;
  currentUserId: number;
}

export default function ApprovalTabPanel({
  title,
  fetchUrl,
  showActions = false,
  onApprove,
  onReject,
  onSelect,
  currentUserId,
}: ApprovalTabPanelProps) {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [items, setItems] = useState<ApprovalListItem[]>([]);

  const { commonCodeMap } = useCommonCodeMap([
    "APPROVAL_TARGET",
    "APPROVAL_STATUS",
  ]);

  useEffect(() => {
    const url = new URL(fetchUrl, window.location.origin);
    if (selectedType !== "ALL") {
      url.searchParams.set("target_type", selectedType);
    }
    const finalUrl = url.toString().replace(window.location.origin, "");

    api
      .get(finalUrl)
      .then((res) => setItems(res.data))
      .catch(() => toast.error("결재 목록 불러오기 실패"));
  }, [selectedType, fetchUrl]);

  const filteredItems = items.filter((item) => {
    console.log("🔍 상태 필터 비교", {
      itemStatus: item.status,
      statusFilter,
      passed: statusFilter === "ALL" || item.status === statusFilter,
    });
    if (!item.status) return false;
    return statusFilter === "ALL" || item.status === statusFilter;
  });

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>

      {/* 문서 유형 필터 */}
      <div>
        <label className="text-sm font-medium mr-2">문서 유형</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {[
            { code: "ALL", label: "전체" },
            ...(commonCodeMap["APPROVAL_TARGET"] || []).filter(
              (c) => c.code !== "TODO"
            ),
          ].map((type) => (
            <option key={type.code} value={type.code}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* 승인 상태 필터 */}
      <div>
        <label className="text-sm font-medium mr-2">승인 상태</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">전체</option>
          {commonCodeMap["APPROVAL_STATUS"]?.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <p>현재 항목이 없습니다.</p>
      ) : (
        filteredItems.map((a) => (
          <ApprovalCard
            key={a.id}
            targetType={a.targetType}
            targetId={a.targetId}
            requesterName={a.requesterName}
            createdAt={a.createdAt}
            dueDate={a.dueDate}
            data={a.data}
            onClick={() => onSelect?.(a)}
            onApprove={
              showActions && onApprove
                ? () => onApprove(a.targetType, a.targetId)
                : undefined
            }
            onReject={
              showActions && onReject
                ? (memo) => onReject(a.targetType, a.targetId, memo)
                : undefined
            }
            approval={{
              status: a.status,
              step: a.step,
              current_pending_step: a.current_pending_step,
              approver_id: a.approver_id,
            }}
            currentUserId={currentUserId}
            showActions={showActions}
          />
        ))
      )}
    </div>
  );
}
