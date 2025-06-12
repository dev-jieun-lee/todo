// src/components/approvals/ApprovalCard.tsx
import { Card, CardContent } from "../ui/card";
import { useState, useEffect } from "react";
import api from "../../utils/axiosInstance";
import { useCommonCodeMap } from "../../contexts/CommonCodeContext";
import { getStatusBadge } from "../../utils/getStatusBadge";
import type {
  ApproverInfo,
  ApprovalCardProps,
  ApprovalData,
  VacationSummary,
  KpiData,
  NoticeData,
  ProjectData,
  TransferData,
  DocumentData,
  // ExpenseData,
} from "../../types/approval";

// 문서 유형 요약 텍스트 생성
const getSummaryText = (targetType: string, data: ApprovalData): string => {
  try {
    switch (targetType?.toUpperCase()) {
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

function ApprovalCard({
  targetType,
  targetId,
  requesterName,
  createdAt,
  dueDate,
  data,
  onClick,
  approval,
  currentUserId,
}: ApprovalCardProps & {
  approval: {
    status: string;
    step: number;
    approver_id: number;
  };
  currentUserId: number;
}) {
  const [approverLabel, setApproverLabel] = useState<string>("");
  const commonCodeMap = useCommonCodeMap();

  // 결재라인 요약 fetch
  useEffect(() => {
    if (!targetId || !targetType) return;

    api
      .get(`/approvals/${targetType.toLowerCase()}/${targetId}/detail`)
      .then((res) => {
        const approvers = res.data?.data?.approvers || {};
        // 결재라인 key → POSITION 코드로 변환 테이블
        const positionCodeMap: Record<string, string> = {
          manager: "MANAGER",
          partLead: "PART_LEAD",
          teamLead: "TEAM_LEAD",
          deptHead: "DEPT_HEAD",
          ceo: "CEO",
        };
        // 결재자 이름이 있는 항목만 추출(공통코드 POSITION label 적용)
        const labelList = Object.entries(approvers)
          .filter(([, a]) => (a as ApproverInfo)?.name)
          .map(([key, a]) => {
            const positionCode = positionCodeMap[key] || key.toUpperCase();
            const positionLabel =
              commonCodeMap["POSITION"]?.find((p) => p.code === positionCode)
                ?.label || positionCode;
            return `${positionLabel}: ${(a as ApproverInfo).name}`;
          });
        setApproverLabel(labelList.join(" / "));
      })
      .catch(() => {
        setApproverLabel("");
      });
  }, [targetId, targetType, commonCodeMap]);

  // 상태 badge
  const badge = getStatusBadge(approval.status, commonCodeMap);

  // 요약 텍스트 (확장성 O)
  const summary =
    data && targetType ? getSummaryText(targetType, data) : "(요약 정보 없음)";

  return (
    <Card
      className="w-full shadow-sm border rounded-xl p-4 space-y-3 cursor-pointer hover:bg-gray-50"
      onClick={() =>
        onClick?.({
          targetType,
          targetId,
          requesterName,
          createdAt,
          dueDate,
          data,
          approval,
          currentUserId,
        })
      }
    >
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          {/* 문서유형 라벨(공통코드 기반) */}
          <h3 className="text-lg font-semibold">
            {commonCodeMap["APPROVAL_TARGET"]?.find(
              (c) => c.code === targetType.toUpperCase()
            )?.label || targetType}
          </h3>
          {/* 상태 badge */}
          <span
            style={{
              background: badge.bg,
              color: badge.color,
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 4,
              padding: "1px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {badge.icon} {badge.label}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          요청일: {createdAt} {dueDate && <> · 마감일: {dueDate}</>}
        </div>
        <p className="text-sm text-gray-800">
          {summary || "(데이터 없음 또는 미지원 유형)"}
        </p>
        {/* 결재라인(approverLabel) */}
        {approverLabel && (
          <p className="text-sm text-gray-500 italic">
            🔒 결재 라인: <span className="font-medium">{approverLabel}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default ApprovalCard;
