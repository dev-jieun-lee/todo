import "./VacationDetailView.css";
import type { VacationDetailData } from "../../../types/approval";
import { useDateUtils } from "../../../hooks/useDateUtils";

export interface VacationDetailViewProps {
  data: VacationDetailData;
  approvers: VacationDetailData["approvers"];
  commonCodeMap: Record<string, { code: string; label: string }[]>;
}

export default function VacationDetailView({
  data,
  approvers,
  commonCodeMap,
}: VacationDetailViewProps) {
  const { formatDate, calculateDays } = useDateUtils();

  const departmentLabel =
    commonCodeMap["DEPARTMENT"]?.find(
      (d) => d.code === data.snapshot_department_code
    )?.label || data.snapshot_department_label;

  const positionLabel =
    commonCodeMap["POSITION"]?.find(
      (p) => p.code === data.snapshot_position_code
    )?.label || data.snapshot_position_label;

  const vacationTypeList = (commonCodeMap["VACATION_TYPE"] || []).slice(0, 7);

  // 결재자 칸 렌더링: 이름, 승인일시, 승인마크 ✔️
  // function renderApproverCell(role: string) {
  //   // approvers: {manager, partLead, teamLead, deptHead, ceo}
  //   const approver = approvers?.[role];
  //   if (!approver) return "";

  //   if (
  //     typeof approver === "object" &&
  //     approver !== null &&
  //     "name" in approver
  //   ) {
  //     return (
  //       <div style={{ minHeight: 36, minWidth: 70 }}>
  //         <span>{approver.name}</span>
  //         {approver.status === "APPROVED" && (
  //           <span
  //             style={{ display: "block", fontSize: "11px", color: "#16a34a" }}
  //           >
  //             {approver.approvedAt
  //               ? approver.approvedAt.slice(0, 16).replace("T", " ")
  //               : ""}
  //             <span style={{ marginLeft: 3, color: "#16a34a" }}>✔</span>
  //           </span>
  //         )}
  //         {approver.status === "REJECTED" && (
  //           <span
  //             style={{ display: "block", fontSize: "11px", color: "#ef4444" }}
  //           >
  //             반려
  //           </span>
  //         )}
  //       </div>
  //     );
  //   }
  //   return approver;
  // }

  function renderApproverCell(role: string) {
    const approver = approvers?.[role];
    if (!approver) return "";

    // object 구조
    if (
      typeof approver === "object" &&
      approver !== null &&
      "name" in approver
    ) {
      return (
        <div style={{ minHeight: 36, minWidth: 70 }}>
          <span>{approver.name}</span>
          {approver.status === "APPROVED" && (
            <span
              style={{ display: "block", fontSize: "11px", color: "#16a34a" }}
            >
              승인완료
              {approver.approvedAt && (
                <span style={{ marginLeft: 6, color: "#666" }}>
                  <br />
                  {approver.approvedAt.slice(0, 16).replace("T", " ")}
                </span>
              )}
              <span style={{ marginLeft: 4, color: "#16a34a" }}>✔</span>
            </span>
          )}
          {approver.status === "REJECTED" && (
            <span
              style={{ display: "block", fontSize: "11px", color: "#ef4444" }}
            >
              반려
              {approver.approvedAt && (
                <span style={{ marginLeft: 6, color: "#666" }}>
                  <br />
                  {approver.approvedAt.slice(0, 16).replace("T", " ")}
                </span>
              )}
              <span style={{ marginLeft: 4, color: "#ef4444" }}>✖</span>
            </span>
          )}
          {approver.status === "PENDING" && (
            <span style={{ display: "block", fontSize: "11px", color: "#aaa" }}>
              대기
            </span>
          )}
        </div>
      );
    }
    // 문자열 구조(이전)
    return <span>{approver}</span>;
  }

  return (
    <div className="vacation-form">
      <h2 className="form-title">휴가원</h2>

      <div className="form-date">
        작성일: {data.created_at?.slice(0, 10) || ""}
      </div>

      <table className="approval-line">
        <thead>
          <tr>
            <th></th>
            <th>담당</th>
            <th>파트장</th>
            <th>팀장</th>
            <th>부서장</th>
            <th>대표</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              신청
              <br />
              부서
            </td>
            <td>{renderApproverCell("manager")}</td>
            <td>{renderApproverCell("partLead")}</td>
            <td>{renderApproverCell("teamLead")}</td>
            <td>{renderApproverCell("deptHead")}</td>
            <td>{renderApproverCell("ceo")}</td>
          </tr>
          <tr>
            <td>
              관리
              <br />팀
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div className="form-body">
        <div className="left-box">
          <div className="inline-info">
            <div>
              <div>부서: {departmentLabel}</div>
              <div>직급: {positionLabel}</div>
              <div>성명: {data.snapshot_name}</div>
            </div>
            <div>
              <div>사번: {data.employee_number}</div>
            </div>
          </div>

          <div className="vacation-period">
            <label>1. 기간</label>
            <div>
              {formatDate(data.start_date)}
              <br />~ {formatDate(data.end_date)} (
              {calculateDays(data.start_date, data.end_date)}일간)
            </div>
          </div>

          <div className="vacation-reason">
            <label>2. 사유:</label>
            <div className="reason-box no-border">{data.reason}</div>
          </div>
        </div>

        <div className="right-box">
          <div className="vacation-type-list">
            {vacationTypeList.map((type, idx) => (
              <div
                key={type.code}
                className={data.type_code === type.code ? "checked" : ""}
              >
                {idx + 1}. {type.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="note-section">
        <label>비고</label>
        <div className="note-box">{data.note || ""}</div>
      </div>

      <div className="footer-notice">
        ※ 사유 없을 경우 3일 전까지 경영지원팀에 제출할 것
      </div>

      <div className="company-name">(주)한네트</div>
    </div>
  );
}
