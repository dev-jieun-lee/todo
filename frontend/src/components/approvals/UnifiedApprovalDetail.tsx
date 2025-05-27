import { useEffect, useState } from "react";
import ApprovalDetailLayout from "./ApprovalDetailLayout";
import ApprovalDetailContent from "./ApprovalDetailContent";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import type { ApprovalDetail, ApprovalHistoryItem } from "../../types/approval";

interface Props {
  targetType: string;
  targetId: number;
  showActions?: boolean;
}

export default function UnifiedApprovalDetailInlineView({
  targetType,
  targetId,
}: Props) {
  const [detail, setDetail] = useState<ApprovalDetail | null>(null);
  const [history, setHistory] = useState<ApprovalHistoryItem[]>([]);
  useEffect(() => {
    api
      .get(`/approvals/${targetType.toLowerCase()}/${targetId}/detail`)
      .then((res) => setDetail(res.data))
      .catch(() => toast.error("상세 정보를 불러오지 못했습니다."));

    api
      .get(`/approvals/${targetType.toLowerCase()}/${targetId}/history`)
      .then((res) => setHistory(res.data))
      .catch(() => toast.error("이력 정보를 불러오지 못했습니다."));
  }, [targetType, targetId]);

  const handleApprove = () => {
    api
      .post(`/approvals/${targetType.toLowerCase()}/${targetId}/approve`)
      .then(() => toast.success("승인 완료"))
      .catch(() => toast.error("승인 실패"));
  };

  const handleReject = (memo: string) => {
    api
      .post(`/approvals/${targetType.toLowerCase()}/${targetId}/reject`, {
        memo,
      })
      .then(() => toast.success("반려 완료"))
      .catch(() => toast.error("반려 실패"));
  };

  if (!detail)
    return (
      <p className="text-sm text-gray-500">
        문서를 선택하면 상세 정보가 표시됩니다.
      </p>
    );

  return (
    <ApprovalDetailLayout
      title={`${targetType.toUpperCase()} 문서 상세`}
      history={history}
      onApprove={handleApprove}
      onReject={handleReject}
    >
      <ApprovalDetailContent targetType={targetType} data={detail.data} />
    </ApprovalDetailLayout>
  );
}
