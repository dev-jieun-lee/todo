import { useEffect, useState } from "react";
// import ApprovalCard from "./ApprovalCard";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import type { ApprovalItem, ApprovalListItem } from "../../types/approval";
import { useCommonCodeMap } from "../../contexts/CommonCodeContext";
// import { useUser } from "../../contexts/useUser";

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
  // showActions = false,
  // onApprove,
  // onReject,
  onSelect,
  currentUserId,
}: ApprovalTabPanelProps) {
  console.log("TabPanel currentUserId:", currentUserId);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [items, setItems] = useState<ApprovalListItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const commonCodeMap = useCommonCodeMap();
  // const { id } = useUser();

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

  // const filteredItems = items.filter((item) => {
  //   console.log("🔍 상태 필터 비교", {
  //     itemStatus: item.status,
  //     statusFilter,
  //     passed: statusFilter === "ALL" || item.status === statusFilter,
  //   });
  //   if (!item.status) return false;
  //   return statusFilter === "ALL" || item.status === statusFilter;
  // });

  //검색
  const filteredItems = items.filter((item) => {
    if (!item.status) return false;
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

    if (searchText.trim()) {
      const lower = searchText.trim().toLowerCase();
      const docTypeLabel =
        commonCodeMap["APPROVAL_TARGET"]?.find(
          (c) => c.code === item.targetType?.toUpperCase()
        )?.label ||
        item.targetType ||
        "";
      const docTitle =
        item.data && "title" in item.data && typeof item.data.title === "string"
          ? item.data.title
          : "";
      // 휴가 유형 라벨(연차, 반차, 병가 등)
      const leaveTypeLabel =
        item.data &&
        "type_label" in item.data &&
        typeof item.data.type_label === "string"
          ? item.data.type_label
          : "";

      const statusLabel =
        commonCodeMap["APPROVAL_STATUS"]?.find((c) => c.code === item.status)
          ?.label ||
        item.status ||
        "";
      const fields = [
        docTypeLabel, // 문서유형(한글, 예: 휴가 신청)
        item.requesterName, // 요청자명
        docTitle, // 문서명(title)
        leaveTypeLabel, // 휴가 유형(연차, 반차 등)
        statusLabel, // 상태(대기, 승인, 반려 등)
      ];
      const has = fields.some(
        (f) => typeof f === "string" && f.toLowerCase().includes(lower)
      );
      if (!has) return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      {/* 문서 유형 필터 */}
      <div className="flex gap-4 mb-4">
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
        <div>
          <label className="text-sm font-medium mr-2">검색</label>
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="요청자, 문서명 등 검색"
          />
        </div>
      </div>
      {/* 검색창 */}

      <div className="p-6 space-y-4">
        {/* 필터 영역은 그대로 */}
        {/* 표형 목록 */}
        <table className="w-full text-sm border">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-2 py-1">문서유형</th>
              <th className="px-2 py-1">요청자</th>
              <th className="px-2 py-1">요청일</th>
              <th className="px-2 py-1">상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((a, idx) => (
              <tr
                key={a.id}
                className={`
          ${idx % 2 === 1 ? "bg-gray-50" : ""}
          cursor-pointer hover:bg-blue-50 transition
        `}
                onClick={() => onSelect?.(a)}
              >
                <td className="px-2 py-1 border">
                  {commonCodeMap["APPROVAL_TARGET"]?.find(
                    (c) => c.code === a.targetType?.toUpperCase()
                  )?.label || a.targetType}
                </td>
                <td className="px-2 py-1 border">{a.requesterName}</td>
                <td className="px-2 py-1 border">
                  {a.createdAt?.slice(0, 16)}
                </td>
                <td className="px-2 py-1 border">
                  {commonCodeMap["APPROVAL_STATUS"]?.find(
                    (c) => c.code === a.status
                  )?.label || a.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 없음 안내 */}
        {filteredItems.length === 0 && <p>현재 항목이 없습니다.</p>}
      </div>
    </div>
  );
}
