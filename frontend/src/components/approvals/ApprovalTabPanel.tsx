import { useEffect, useState } from "react";
import ApprovalCard from "./ApprovalCard";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import type { ApprovalItem, ApprovalListItem } from "../../types/approval";
import type { CommonCode } from "../../types/CommonCode";

interface ApprovalTabPanelProps {
  title: string;
  fetchUrl: string; // API endpoint (without target_type param)
  showActions?: boolean;
  onApprove?: (type: string, id: number) => void;
  onReject?: (type: string, id: number, memo: string) => void;
  onSelect?: (item: ApprovalItem) => void;
}

export default function ApprovalTabPanel({
  title,
  fetchUrl,
  showActions = false,
  onApprove,
  onReject,
  onSelect,
}: ApprovalTabPanelProps) {
  const [targetTypes, setTargetTypes] = useState<CommonCode[]>([]);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [items, setItems] = useState<ApprovalListItem[]>([]);

  useEffect(() => {
    api
      .get("/common-codes?group=APPROVAL_TARGET")
      .then((res) => {
        setTargetTypes(res.data.filter((c: CommonCode) => c.code !== "TODO"));
      })
      .catch(() => toast.error("결재 대상 목록을 불러오지 못했습니다."));
  }, []);

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
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            selectedType === "ALL"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
          onClick={() => setSelectedType("ALL")}
        >
          전체
        </button>
        {targetTypes.map((type) => (
          <button
            key={type.code}
            className={`px-4 py-2 rounded ${
              selectedType === type.code
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setSelectedType(type.code)}
          >
            {type.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p>현재 항목이 없습니다.</p>
      ) : (
        items.map((a) => (
          <ApprovalCard
            key={a.id}
            targetType={a.targetType}
            targetId={a.targetId}
            requesterName={a.requesterName}
            createdAt={a.createdAt}
            dueDate={a.dueDate}
            data={a.data}
            showActions={showActions}
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
          />
        ))
      )}
    </div>
  );
}
