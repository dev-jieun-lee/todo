import { useMemo, useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import { logEvent } from "../../utils/logger";
import type { VacationDetail } from "../../types/vacation";
import type { VacationFormState } from "../../types/forms/vacationForm";
import {
  fetchApprovalLines,
  filterRealApprovers,
} from "../../services/approvalService";
import type { ApprovalLine } from "../../services/approvalService";
interface VacationFormProps {
  onSubmitted?: () => void;
  className?: string;
  vacations: VacationDetail[];
  commonCodeMap: Record<string, { code: string; label: string }[]>;
  user: {
    id: number;
    department_code: string;
    position_code: string;
    team_code: string;
  };
}

const timeOptions = [
  "09:00-11:00",
  "10:00-12:00",
  "11:00-13:00",
  "13:00-15:00",
  "14:00-16:00",
];
// 결재라인 조건 평가 함수
function evalCondition(expr: string, applicantRole: string): boolean {
  if (!expr || expr.trim() === "") return true;
  try {
    const inMatch = expr.match(/applicant_role\s+IN\s*\(([^)]+)\)/i);
    if (inMatch) {
      const roleList = inMatch[1]
        .split(",")
        .map((role) => role.replace(/['"]/g, "").trim());
      return roleList.includes(applicantRole);
    }
    const eqMatch = expr.match(/applicant_role\s*=\s*['"]?([A-Z_]+)['"]?/i);
    if (eqMatch) {
      return applicantRole === eqMatch[1];
    }
    const neqMatch = expr.match(/applicant_role\s*!=\s*['"]?([A-Z_]+)['"]?/i);
    if (neqMatch) {
      return applicantRole !== neqMatch[1];
    }
    return false;
  } catch (err) {
    console.error("[evalCondition] 파싱 에러:", err, expr, applicantRole);
    return false;
  }
}

const VacationForm: React.FC<VacationFormProps> = ({
  onSubmitted,
  className = "",
  vacations,
  commonCodeMap,
  user,
}) => {
  const [approvalLines, setApprovalLines] = useState<ApprovalLine[]>([]);
  const [approvalLinesLoading, setApprovalLinesLoading] = useState(false);

  // 1) 공통코드 'APPROVAL_ROUTE'에서 결재선 목록 불러오기
  const approvalRouteOptions = useMemo(() => {
    console.log(
      "[1] useMemo - 결재선 옵션 계산",
      commonCodeMap["APPROVAL_ROUTE"]
    );
    return commonCodeMap["APPROVAL_ROUTE"] || [];
  }, [commonCodeMap]);

  // [2] 결재선 선택 상태
  const [selectedRouteName, setSelectedRouteName] = useState("");
  useEffect(() => {
    if (approvalRouteOptions.length > 0) {
      setSelectedRouteName(approvalRouteOptions[0].code);
      console.log(
        "[2] useEffect - 결재선 초기값 세팅:",
        approvalRouteOptions[0].code
      );
    }
  }, [approvalRouteOptions]);

  // [3] 결재라인(approval_lines) API 호출 (안내용/테스트용)
  useEffect(() => {
    if (!selectedRouteName) {
      console.log("[결재선 미선택] approval_lines API 호출 생략");
      return;
    }
    async function loadApprovalLines() {
      setApprovalLinesLoading(true);
      console.log("[approval_lines 호출] 파라미터:", {
        selectedRouteName,
        department: user.department_code,
        team: user.team_code,
        position: user.position_code,
      });
      try {
        const result = await fetchApprovalLines(
          "VACATION",
          user.department_code,
          user.team_code,
          selectedRouteName
        );
        // approvalLines: ApprovalLine[]
        setApprovalLines(result);
        console.log("[approval_lines 응답]:", result);
      } catch (err: unknown) {
        toast.error("결재선 불러오기 실패");
        if (err instanceof Error) {
          console.error(
            "[approval_lines 불러오기 에러]:",
            err.message,
            err.stack
          );
        } else {
          console.error("[approval_lines 불러오기 에러]:", err);
        }
        setApprovalLines([]);
      } finally {
        setApprovalLinesLoading(false);
      }
    }
    loadApprovalLines();
  }, [
    selectedRouteName,
    user.department_code,
    user.team_code,
    user.position_code,
  ]);

  // 4) 내 직급 기준으로 결재라인 필터
  const applicantRole = user.position_code;
  const filteredApprovalLines = useMemo(
    () =>
      approvalLines.filter((line) =>
        evalCondition(line.condition_expression ?? "", applicantRole)
      ),
    [approvalLines, applicantRole]
  );

  // 5) 휴가 폼 상태
  const [form, setForm] = useState<VacationFormState>({
    type_code: "ANNUAL",
    start_date: "",
    end_date: "",
    reason: "",
    half_day_type: "",
    time_shift_range: "",
    start_time: "",
    end_time: "",
    duration_unit: "FULL",
  });
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const isHalfDay = form.type_code === "HALF";
  const isTimeShift = form.type_code === "TIME_SHIFT";

  // 6) 반차/시차 종료일 자동 처리
  useEffect(() => {
    if (isHalfDay || isTimeShift) {
      setForm((prev) => ({ ...prev, end_date: prev.start_date }));
      console.log("[5] 반차/시차: 종료일 자동 고정", form.start_date);
    }
  }, [form.start_date, form.type_code, isHalfDay, isTimeShift]);

  // 6) 반차/시차 종료일 자동 처리
  useEffect(() => {
    if (isHalfDay || isTimeShift) {
      setForm((prev) => ({ ...prev, end_date: prev.start_date }));
    }
  }, [form.start_date, form.type_code, isHalfDay, isTimeShift]);

  // 7) 휴가 신청 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[6-1] 휴가 신청 시작: ", form);

    // 1) 날짜 체크
    if (form.start_date > form.end_date) {
      toast.error("시작일은 종료일보다 앞서야 합니다.");
      console.warn("[6-2] 시작일 > 종료일 오류");
      return;
    }

    // 2) 시간대 처리
    const duration_unit = isTimeShift ? "HOUR" : isHalfDay ? "HALF" : "FULL";
    const start_time = isHalfDay
      ? form.half_day_type === "AM"
        ? "09:00"
        : "13:30"
      : isTimeShift
      ? form.time_shift_range.split("-")[0]
      : "";
    const end_time = isHalfDay
      ? form.half_day_type === "AM"
        ? "13:30"
        : "18:00"
      : isTimeShift
      ? form.time_shift_range.split("-")[1]
      : "";

    // (클라이언트 단 중복 휴가 체크, 서버에서도 체크됨)
    console.log("🔍 중복 체크 시작");
    const formStart = form.start_date;
    const formEnd = isHalfDay || isTimeShift ? form.start_date : form.end_date;
    const isOverlapping = vacations.some((v) => {
      if (v.status === "CANCELED" || v.status === "CANCELLED") return false;
      const dateOverlap = formStart <= v.end_date && formEnd >= v.start_date;
      if (
        dateOverlap &&
        (duration_unit === "HOUR" || duration_unit === "HALF")
      ) {
        if (v.duration_unit === "HOUR" || v.duration_unit === "HALF") {
          const vStart = v.start_time ?? "00:00";
          const vEnd = v.end_time ?? "23:59";
          return !(end_time <= vStart || start_time >= vEnd);
        }
      }
      return dateOverlap && v.duration_unit === "FULL";
    });

    if (isOverlapping) {
      toast.error("해당 기간에 이미 휴가 신청이 존재합니다.");
      console.warn("[6-3] 중복 휴가 신청 감지:", formStart, "~", formEnd);
      return;
    }

    // 4) payload 생성
    const payload = {
      ...form,
      duration_unit,
      start_time,
      end_time,
      route_name: selectedRouteName,
      department_code: user.department_code,
      team_code: user.team_code,
    };
    console.log("[6-4] 휴가 신청 API payload:", payload);
    try {
      setSubmitting(true);
      await api.post("/vacations/apply", payload);
      toast.success("휴가 신청이 완료되었습니다.");
      logEvent(
        `휴가 신청 완료: ${form.type_code} (${form.start_date} ~ ${form.end_date})`
      );
      setForm({
        type_code: "ANNUAL",
        start_date: "",
        end_date: "",
        reason: "",
        half_day_type: "",
        time_shift_range: "",
        start_time: "",
        end_time: "",
        duration_unit: "FULL",
      });
      onSubmitted?.();
    } catch (err) {
      toast.error("휴가 신청에 실패했습니다.");
      console.error("휴가 신청 API 오류:", err);
      logEvent("❌ 휴가 신청 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const realApprovers = useMemo(
    () => filterRealApprovers(filteredApprovalLines), // <- 이미 evalCondition 거친 라인에 필터 적용
    [filteredApprovalLines]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white border rounded-lg p-6 space-y-6 ${className}`}
    >
      <h3 className="text-xl font-semibold">📝 휴가 신청</h3>

      {/* 휴가 유형 */}
      <div>
        <label className="block text-sm font-medium mb-1">휴가 유형</label>
        <select
          value={form.type_code}
          onChange={(e) => setForm({ ...form, type_code: e.target.value })}
          className="border px-3 py-2 rounded w-60"
        >
          {(commonCodeMap["VACATION_TYPE"] || []).map((type) => (
            <option key={type.code} value={type.code}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* 시작일, 종료일 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">시작일</label>
          <input
            type="date"
            className="border px-3 py-2 rounded w-full"
            min={today}
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">종료일</label>
          <input
            type="date"
            className="border px-3 py-2 rounded w-full"
            min={today}
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required
            readOnly={isHalfDay || isTimeShift}
          />
        </div>
      </div>

      {/* 반차 선택 */}
      {isHalfDay && (
        <div>
          <label className="block mb-1">반차 시간</label>
          <select
            className="border px-3 py-2 rounded w-48"
            value={form.half_day_type}
            onChange={(e) =>
              setForm({ ...form, half_day_type: e.target.value })
            }
            required
          >
            <option value="">선택</option>
            <option value="AM">오전 반차</option>
            <option value="PM">오후 반차</option>
          </select>
        </div>
      )}

      {/* 시차 선택 */}
      {isTimeShift && (
        <div>
          <label className="block mb-1">시차 시간대</label>
          <select
            className="border px-3 py-2 rounded w-48"
            value={form.time_shift_range}
            onChange={(e) =>
              setForm({ ...form, time_shift_range: e.target.value })
            }
            required
          >
            <option value="">선택</option>
            {timeOptions.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 결재자 안내문 */}
      <div>
        <p className="text-sm text-gray-500 italic">
          ※ 결재자는 결재선 별로 자동 지정됩니다.
        </p>
      </div>

      {/* 결재선/결재자 정보 */}
      <div className="flex items-start gap-4 mb-4">
        {/* 결재선 셀렉트박스 */}
        <div>
          <label className="block text-sm font-medium mb-1">결재선 선택</label>
          <select
            value={selectedRouteName}
            onChange={(e) => setSelectedRouteName(e.target.value)}
            className="border px-3 py-2 rounded w-60"
          >
            {approvalRouteOptions.map((route) => (
              <option key={route.code} value={route.code}>
                {route.label}
              </option>
            ))}
          </select>
        </div>

        {/* 결재자 미리보기 (실결재자만!) */}
        <div className="flex flex-col gap-1 pt-7 text-sm min-w-[200px]">
          {approvalLinesLoading ? (
            <span className="text-gray-400">결재라인 불러오는 중...</span>
          ) : realApprovers.length > 0 ? (
            realApprovers.map((line) => (
              <div key={line.id}>
                <span className="font-semibold text-gray-600">
                  {line.step}차:
                </span>{" "}
                {line.proxy_type === "PROXY"
                  ? `[전결] ${
                      line.candidates?.[0]?.name
                        ? `${line.candidates[0].name} (${
                            line.candidates[0].position_label ||
                            line.candidates[0].position_code
                          })`
                        : "전결자 없음"
                    }`
                  : line.candidates
                      .map(
                        (c) =>
                          `${c.name} (${c.position_label || c.position_code})`
                      )
                      .join(", ")}
              </div>
            ))
          ) : (
            <span className="text-gray-400">결재자 정보 없음</span>
          )}
        </div>
      </div>

      {/* 사유 입력 */}
      <div>
        <label className="block mb-1">사유 (선택)</label>
        <textarea
          className="border px-3 py-2 rounded w-full"
          rows={3}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {submitting ? "처리 중..." : "신청하기"}
      </button>
    </form>
  );
};

export default VacationForm;
