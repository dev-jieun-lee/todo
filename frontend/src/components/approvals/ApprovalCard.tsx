// src/components/approvals/ApprovalCard.tsx
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useState, useEffect } from "react";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import type {
  ApprovalCardProps,
  ApprovalData,
  VacationSummary,
  KpiData,
  NoticeData,
  ProjectData,
  TransferData,
  DocumentData,
} from "../../types/approval";

const getSummaryText = (targetType: string, data: ApprovalData): string => {
  try {
    switch (targetType.toUpperCase()) {
      case "VACATION": {
        const d = data as VacationSummary;
        return `${d.start_date} ~ ${d.end_date} (${d.type_label})`;
      }
      case "KPI": {
        const d = data as KpiData;
        return `KPI: ${d.goal_title} (${d.period})`;
      }

      case "NOTICE": {
        const d = data as NoticeData;
        return `공지: ${d.title} · 수신 대상: ${d.target_label}`;
      }
      case "PROJECT": {
        const d = data as ProjectData;
        return `프로젝트명: ${d.name} · 시작일: ${d.start_date}`;
      }
      case "TRANSFER": {
        const d = data as TransferData;
        return `부서 이동: ${d.from_department} → ${d.to_department}`;
      }
      case "DOCUMENT": {
        const d = data as DocumentData;
        return `문서: ${d.title} · 종류: ${d.doc_type}`;
      }
      default:
        return "(알 수 없는 유형)";
    }
  } catch (err) {
    console.error("getSummaryText 오류:", err);
    return "(요약 정보 오류)";
  }
};

const getDetailLink = (targetType: string, targetId: number): string => {
  return `/${targetType.toLowerCase()}/approve/${targetId}`;
};

function ApprovalCard({
  targetType,
  targetId,
  requesterName,
  createdAt,
  dueDate,
  data,
  onApprove,
  onReject,
  showActions = true, // 기본값 true로 설정
}: ApprovalCardProps) {
  const navigate = useNavigate();
  const [rejectMemo, setRejectMemo] = useState("");
  const [typeLabelMap, setTypeLabelMap] = useState<Record<string, string>>({});
  const [approverPosition, setApproverPosition] = useState<string>("");

  useEffect(() => {
    api
      .get("/common-codes?group=APPROVAL_TARGET")
      .then((res) => {
        const map: Record<string, string> = {};
        res.data.forEach((item: { code: string; label: string }) => {
          map[item.code] = item.label;
        });
        setTypeLabelMap(map);
      })
      .catch(() => toast.error("승인 대상 코드 불러오기 실패"));
  }, []);

  useEffect(() => {
    if (!targetId) return;

    api
      .get(`/approvals/position-label/${targetId}`)
      .then((res) => {
        setApproverPosition(res.data?.position_label || "");
      })
      .catch(() => {
        console.warn("승인자 직급 정보를 불러오지 못했습니다.");
      });
  }, [targetId]);

  const summary =
    data && targetType ? getSummaryText(targetType, data) : "(요약 정보 없음)";
  const detailLink = targetId ? getDetailLink(targetType, targetId) : "/";

  return (
    <Card className="w-full shadow-sm border rounded-xl p-4 space-y-3">
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {typeLabelMap[targetType.toUpperCase()] || targetType}
          </h3>
          <Badge variant="outline">신청자: {requesterName}</Badge>
        </div>
        <div className="text-sm text-gray-600">
          요청일: {createdAt} {dueDate && <> · 마감일: {dueDate}</>}
        </div>
        <p className="text-sm text-gray-800">
          {summary || "(데이터 없음 또는 미지원 유형)"}
        </p>

        {approverPosition && (
          <p className="text-sm text-gray-500 italic">
            🔒 결재 라인:{" "}
            <span className="font-medium">{approverPosition}</span>
          </p>
        )}

        {showActions && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(detailLink)}>
              상세 보기
            </Button>
            {onApprove && (
              <Button
                className="bg-green-500 text-white hover:bg-green-600"
                onClick={onApprove}
              >
                승인
              </Button>
            )}
            {onReject && (
              <>
                <input
                  type="text"
                  placeholder="반려 사유"
                  value={rejectMemo}
                  onChange={(e) => setRejectMemo(e.target.value)}
                  className="border rounded px-2 py-1 text-sm w-48"
                />
                <Button
                  variant="destructive"
                  onClick={() => onReject(rejectMemo)}
                >
                  반려
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ApprovalCard;
