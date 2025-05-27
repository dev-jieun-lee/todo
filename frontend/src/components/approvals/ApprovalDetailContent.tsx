//문서 타입 상관없이 단일한 상세 내용 렌더링 담당
import type {
  ApprovalData,
  VacationSummary,
  KpiData,
  TodoData,
  NoticeData,
  ProjectData,
  TransferData,
  DocumentData,
} from "../../types/approval";

interface Props {
  targetType: string;
  data: ApprovalData;
}

export default function ApprovalDetailContent({ targetType, data }: Props) {
  if (!data) return <p>문서 데이터를 찾을 수 없습니다.</p>;

  switch (targetType.toUpperCase()) {
    case "VACATION": {
      const d = data as VacationSummary;
      return (
        <div className="text-sm space-y-1">
          <p>
            📅 휴가 기간: <strong>{d.start_date}</strong> ~{" "}
            <strong>{d.end_date}</strong>
          </p>
          <p>
            📝 휴가 유형: <strong>{d.type_label}</strong>
          </p>
        </div>
      );
    }
    case "KPI": {
      const d = data as KpiData;
      return (
        <div className="text-sm space-y-1">
          <p>
            🎯 KPI 목표: <strong>{d.goal_title}</strong>
          </p>
          <p>
            📆 기간: <strong>{d.period}</strong>
          </p>
        </div>
      );
    }
    case "TODO": {
      const d = data as TodoData;
      return (
        <div className="text-sm space-y-1">
          <p>
            ✅ 할 일: <strong>{d.title}</strong>
          </p>
          <p>
            👤 담당자: <strong>{d.assignee}</strong>
          </p>
        </div>
      );
    }
    case "NOTICE": {
      const d = data as NoticeData;
      return (
        <div className="text-sm space-y-1">
          <p>
            📢 공지 제목: <strong>{d.title}</strong>
          </p>
          <p>
            👥 대상: <strong>{d.target_label}</strong>
          </p>
        </div>
      );
    }
    case "PROJECT": {
      const d = data as ProjectData;
      return (
        <div className="text-sm space-y-1">
          <p>
            📁 프로젝트명: <strong>{d.name}</strong>
          </p>
          <p>
            📆 시작일: <strong>{d.start_date}</strong>
          </p>
        </div>
      );
    }
    case "TRANSFER": {
      const d = data as TransferData;
      return (
        <div className="text-sm space-y-1">
          <p>
            🏢 부서 이동: <strong>{d.from_department}</strong> →{" "}
            <strong>{d.to_department}</strong>
          </p>
        </div>
      );
    }
    case "DOCUMENT": {
      const d = data as DocumentData;
      return (
        <div className="text-sm space-y-1">
          <p>
            📄 문서 제목: <strong>{d.title}</strong>
          </p>
          <p>
            📂 문서 종류: <strong>{d.doc_type}</strong>
          </p>
        </div>
      );
    }
    default:
      return <p>지원되지 않는 문서 유형입니다.</p>;
  }
}
