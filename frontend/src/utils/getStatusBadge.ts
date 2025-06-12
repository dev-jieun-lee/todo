/**
 * 결재 상태 코드에 따라 라벨/컬러/아이콘을 반환하는 함수
 * @param status  상태 코드("APPROVED", "REJECTED", ...)
 * @param codeMap (optional) 공통코드맵(라벨 변환용)
 */
export function getStatusBadge(
  status: string,
  codeMap?: Record<string, { code: string; label: string }[]>
) {
  // 라벨: 공통코드에 있으면 변환, 없으면 코드 그대로
  const label =
    codeMap?.["APPROVAL_STATUS"]?.find((c) => c.code === status)?.label ||
    (status === "APPROVED"
      ? "승인"
      : status === "REJECTED"
      ? "반려"
      : status === "PENDING"
      ? "대기"
      : status);

  // 컬러/아이콘은 고정값
  const color =
    status === "APPROVED"
      ? "#16a34a"
      : status === "REJECTED"
      ? "#ef4444"
      : status === "PENDING"
      ? "#a3a3a3"
      : "#888";

  const bg =
    status === "APPROVED"
      ? "#dcfce7"
      : status === "REJECTED"
      ? "#fee2e2"
      : status === "PENDING"
      ? "#f3f4f6"
      : "#e5e7eb";

  const icon =
    status === "APPROVED"
      ? "✔"
      : status === "REJECTED"
      ? "✖"
      : status === "PENDING"
      ? "⏳"
      : "—";

  return { label, color, bg, icon };
}
