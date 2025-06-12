import { useState } from "react";
import api from "../utils/axiosInstance";
import type { ApprovalHistoryItem } from "../types/approval";

export default function useApprovalHistory(
  targetType: string,
  targetId: number | string
) {
  const [history, setHistory] = useState<ApprovalHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/approvals/${targetType}/${targetId}/history`);
      setHistory(res.data);
    } finally {
      setLoading(false);
    }
  };

  return { history, loading, fetchHistory };
}
