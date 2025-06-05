// src/components/approvals/ActionButtons.tsx
import { useRef } from "react";

interface Props {
  onApprove: () => void;
  onReject: (memo: string) => void;
}

export default function ActionButtons({ onApprove, onReject }: Props) {
  const rejectMemoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-2 items-center">
      <input
        ref={rejectMemoRef}
        type="text"
        placeholder="반려 사유"
        className="border rounded px-2 py-1 text-sm w-44"
      />
      <button
        onClick={() => {
          const reason = rejectMemoRef.current?.value || "";
          if (!reason.trim()) {
            alert("반려 사유를 입력하세요.");
            return;
          }
          if (window.confirm("반려하시겠습니까?")) {
            onReject(reason);
            alert("반려가 완료되었습니다.");
          }
        }}
        className="bg-red-500 text-white px-4 py-1 rounded"
      >
        반려
      </button>
      <button
        onClick={() => {
          if (window.confirm("승인하시겠습니까?")) {
            onApprove();
            alert("승인이 완료되었습니다.");
          }
        }}
        className="bg-green-500 text-white px-4 py-1 rounded"
      >
        승인
      </button>
    </div>
  );
}
