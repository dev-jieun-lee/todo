import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import { logEvent } from "../../utils/logger";
import type { VacationDetail } from "../../types/vacation";
import type { VacationFormState } from "../../types/forms/vacationForm";

interface VacationFormProps {
  onSubmitted?: () => void;
  className?: string;
  vacations: VacationDetail[];
}

const timeOptions = [
  "09:00-11:00",
  "10:00-12:00",
  "11:00-13:00",
  "13:00-15:00",
  "14:00-16:00",
];

const VacationForm: React.FC<VacationFormProps> = ({
  onSubmitted,
  className = "",
  vacations,
}) => {
  const [types, setTypes] = useState<{ code: string; label: string }[]>([]);
  const [approvers, setApprovers] = useState<
    { id: number; name: string; position_label: string }[]
  >([]);
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
    approver_id: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const isHalfDay = form.type_code === "HALF";
  const isTimeShift = form.type_code === "TIME_SHIFT";

  useEffect(() => {
    api
      .get("/common-codes?group=VACATION_TYPE")
      .then((res) => setTypes(res.data))
      .catch((err) => {
        toast.error("휴가 유형을 불러오지 못했습니다.");
        console.error("휴가 유형 코드 요청 실패:", err);
        logEvent("❌ 휴가 유형 코드 요청 실패");
      });

    api
      .get("/user/approvers")
      .then((res) => setApprovers(res.data))
      .catch((err) => {
        toast.error("결재자 목록 불러오기 실패");
        console.error("결재자 목록 API 실패:", err);
        logEvent("❌ 결재자 목록 API 실패");
      });
  }, []);

  useEffect(() => {
    if (isHalfDay || isTimeShift) {
      setForm((prev) => ({ ...prev, end_date: prev.start_date }));
    }
  }, [form.start_date, form.type_code, isHalfDay, isTimeShift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.start_date > form.end_date) {
      toast.error("시작일은 종료일보다 앞서야 합니다.");
      return;
    }

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

    const formStart = form.start_date;
    const formEnd = isHalfDay || isTimeShift ? form.start_date : form.end_date;

    const isOverlapping = vacations.some((v) => {
      if (v.status === "CANCELED") return false;
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
      return;
    }

    const payload = {
      ...form,
      duration_unit,
      start_time,
      end_time,
      approver_id: form.approver_id,
    };

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
        approver_id: null,
      });

      onSubmitted?.();
    } catch (err) {
      toast.error("휴가 신청에 실패했습니다.");
      console.error("휴가 신청 에러:", err);
      logEvent("❌ 휴가 신청 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white border rounded-lg p-6 space-y-6 ${className}`}
    >
      <h3 className="text-xl font-semibold">📝 휴가 신청</h3>

      <div>
        <label className="block text-sm font-medium mb-1">휴가 유형</label>
        <select
          value={form.type_code}
          onChange={(e) => setForm({ ...form, type_code: e.target.value })}
          className="border px-3 py-2 rounded w-60"
        >
          {types.map((type) => (
            <option key={type.code} value={type.code}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

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

      <div>
        <label className="block text-sm font-medium mb-1">결재자 지정</label>
        <select
          className="border px-3 py-2 rounded w-60"
          value={form.approver_id ?? ""}
          onChange={(e) =>
            setForm({ ...form, approver_id: Number(e.target.value) })
          }
          required
        >
          <option value="">선택하세요</option>
          {approvers.map((a) => (
            <option key={a.id} value={a.id}>
              {a.position_label}: {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">사유 (선택)</label>
        <textarea
          className="border px-3 py-2 rounded w-full"
          rows={3}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
      </div>

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
