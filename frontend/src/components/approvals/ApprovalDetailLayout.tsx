import { useRef } from "react";
import type { ReactNode } from "react";
import type { ApprovalHistoryItem } from "../../types/approval";

interface Props {
  title: string;
  children: ReactNode;
  history: ApprovalHistoryItem[];
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: (memo: string) => void;
}

export default function ApprovalDetailLayout({
  title,
  children,
  // history,
  showActions = false,
  onApprove,
  onReject,
}: Props) {
  const rejectMemoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4 w-full">
      <h2 className="text-lg font-bold">{title}</h2>
      <div>{children}</div>

      {/* 승인/반려 버튼 (내 차례 + 핸들러 있을 때만) */}
      {showActions && onApprove && onReject && (
        <div className="flex gap-2 items-center">
          <input
            ref={rejectMemoRef}
            type="text"
            placeholder="반려 사유"
            className="border rounded px-2 py-1 text-sm w-64"
          />
          <button
            onClick={() => onReject(rejectMemoRef.current?.value || "")}
            className="bg-red-500 text-white px-4 py-1 rounded"
          >
            반려
          </button>
          <button
            onClick={onApprove}
            className="bg-green-500 text-white px-4 py-1 rounded"
          >
            승인
          </button>
        </div>
      )}

      {/* 승인 이력 */}
      {/* <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">승인 이력</h3>
        <ul className="text-sm space-y-1">
          {history.map((h, idx) => {
            const position = h.position_label || "";
            const department = h.department_label || "";
            const name = `${position} ${h.actor_name}`.trim();
            const deptText = department ? ` (${department})` : "";

            return (
              <li key={idx}>
                [{h.step}단계] {name}
                {deptText} - {h.action} ({h.memo || "-"}) @ {h.performed_at}
              </li>
            );
          })}
        </ul>
      </div> */}
    </div>
  );
}
