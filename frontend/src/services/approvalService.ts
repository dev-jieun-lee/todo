import api from "../utils/axiosInstance";
/**
 * 결재선(approval_lines) 조회 API
 * @param docType - 문서 유형(VACATION 등)
 * @param departmentCode - 부서 코드
 * @param teamCode - 팀 코드
 * @param routeName - 결재선 이름
 * @returns 결재선 목록(배열) 또는 빈 배열
 */

export async function fetchApprovalLines(
  docType: string,
  department: string,
  team: string,
  routeName: string
) {
  try {
    const response = await api.get("/approvals/approval-lines", {
      params: {
        doc_type: docType,
        department_code: department,
        team_code: team,
        route_name: routeName,
      },
    });
    // 정상적으로 데이터 반환시
    return response.data.approvalLines ?? [];
  } catch (err: unknown) {
    if (err instanceof Error) {
      // 에러 발생시 콘솔, 사용자 안내, 빈 배열 반환 등 방어
      console.error("[fetchApprovalLines] 결재선 조회 실패:", err.message);
    } else {
      console.error("[fetchApprovalLines] 결재선 조회 실패(Unknown):", err);
    }
    // (실전에서는 Sentry, toast, 로깅 등 활용 가능)
    // 예시: toast.error("결재선 불러오기 실패"); <-- UI 레이어에서 호출 권장
    return [];
  }
}

/**
 * 실제 결재자만 추출(SKIP, 후보 없음 제외)
 */
export function filterRealApprovers(lines: ApprovalLine[]): ApprovalLine[] {
  return lines.filter(
    (line) =>
      line.proxy_type !== "SKIP" && // 대각선 아닌 라인
      (line.proxy_type === null ||
        line.proxy_type === "" ||
        line.proxy_type === undefined) // 전결(PROXY)도 제외하려면 이 줄을 빼지 말 것
  );
}

// ApprovalLine 타입은 import 또는 아래와 같이 정의
export interface ApprovalCandidate {
  id: number;
  name: string;
  position_code: string;
  position_label?: string;
}
export interface ApprovalLine {
  id: number;
  step: number;
  role_code: string;
  role_label?: string;
  proxy_type?: string;
  proxy_role?: string;
  doc_type: string;
  department_code: string;
  user_id?: number;
  is_required?: number;
  route_name?: string;
  condition_type?: string;
  min_value?: number;
  max_value?: number;
  candidates: ApprovalCandidate[];
  condition_expression?: string;
  parallel_group?: number;
  is_parallel?: number;
  is_merge?: number;
  note?: string;
  sort_order?: number;
  created_at?: string;
}
