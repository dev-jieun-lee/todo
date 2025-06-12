import { useState } from "react";
import type { ApprovalData, VacationDetailData } from "../../types/approval";
import VacationDetailContent from "./detailForms/VacationDetailContent";
import UnsupportedDetailContent from "./detailForms/UnsupportedDetailContent";
import useApprovalHistory from "../../hooks/useApprovalHistory";
import { getStatusBadge } from "../../utils/getStatusBadge";

interface UnifiedApprovalDetailContentProps {
  targetType: string;
  targetId: number; // 결재문서 id (결재이력 조회용)
  data: ApprovalData | VacationDetailData;
  commonCodeMap: Record<string, { code: string; label: string }[]>;
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
  targetId,
  data,
  commonCodeMap,
}: UnifiedApprovalDetailContentProps) {
  // 결재이력 fetch hook + 상태
  const { history, loading, fetchHistory } = useApprovalHistory(
    targetType.toLowerCase(),
    targetId
  );
  const [showHistory, setShowHistory] = useState(false);

  // 결재이력 버튼 클릭 핸들러
  const handleShowHistory = async () => {
    if (!showHistory && history.length === 0) await fetchHistory();
    setShowHistory((v) => !v);
  };

  // Vacation만 처리
  switch (targetType.toUpperCase()) {
    case "VACATION":
      if (isVacationDetailData(data)) {
        return (
          <div>
            <VacationDetailContent
              data={data}
              approvers={data.approvers}
              commonCodeMap={commonCodeMap}
            />
            {/* 결재이력 버튼+리스트 */}
            <button
              className="bg-gray-100 border rounded px-3 py-1 text-sm mt-4"
              onClick={handleShowHistory}
            >
              {showHistory ? "결재이력 닫기" : "결재이력 보기"}
            </button>
            {showHistory && (
              <div className="mt-3">
                {loading ? (
                  <div className="text-gray-400">이력 불러오는 중...</div>
                ) : history.length ? (
                  <ul>
                    {history.map((h, idx) => {
                      const badge = getStatusBadge(h.action, commonCodeMap);
                      return (
                        <li
                          key={idx}
                          className="flex gap-2 items-center text-sm py-1"
                        >
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              borderRadius: 4,
                              padding: "1px 6px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              minWidth: 48,
                              justifyContent: "center",
                            }}
                          >
                            {badge.icon} {badge.label}
                          </span>
                          <span>
                            [{h.step}단계] {h.position_label || ""}{" "}
                            {h.actor_name}
                            {h.department_label && ` (${h.department_label})`}
                            {h.memo && (
                              <>
                                {" "}
                                - <b>{h.memo}</b>
                              </>
                            )}
                            <span className="text-xs text-gray-500 ml-2">
                              {h.performed_at?.slice(0, 16).replace("T", " ")}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-gray-400">이력 없음</div>
                )}
              </div>
            )}
          </div>
        );
      }
      return <UnsupportedDetailContent />;
    case "KPI":
      // <KPIDetailContent ... />
      return <UnsupportedDetailContent />;
    default:
      return <UnsupportedDetailContent />;
  }
}
