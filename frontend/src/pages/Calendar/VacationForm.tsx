// src/pages/calendar/VacationForm.tsx
import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import { logEvent } from "../../utils/logger";

interface VacationFormProps {
  onSubmitted?: () => void;
}

const VacationForm: React.FC<VacationFormProps> = ({ onSubmitted }) => {
  const [types, setTypes] = useState<{ code: string; label: string }[]>([]);
  const [form, setForm] = useState({
    type_code: "ANNUAL",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // 현재 날짜 (오늘) 기준으로 yyyy-mm-dd 포맷 생성
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api
      .get("/common-codes?group=VACATION_TYPE")
      .then((res) => {
        setTypes(res.data);
        logEvent("휴가 유형 코드 목록 불러오기 완료");
      })
      .catch((err) => {
        toast.error("휴가 유형을 불러오지 못했습니다.");
        console.error("휴가 유형 코드 요청 실패:", err);
        logEvent("❌ 휴가 유형 코드 요청 실패");
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.start_date > form.end_date) {
      toast.error("시작일은 종료일보다 앞서야 합니다.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/vacations/apply", form);
      toast.success("휴가 신청이 완료되었습니다.");
      logEvent(
        `휴가 신청 완료: ${form.type_code} (${form.start_date} ~ ${form.end_date})`
      );
      setForm({
        type_code: "ANNUAL",
        start_date: "",
        end_date: "",
        reason: "",
      });
      //콜백 실행
      onSubmitted?.();
    } catch (err) {
      console.error("휴가 신청 에러:", err);
      toast.error("휴가 신청에 실패했습니다.");
      logEvent("❌ 휴가 신청 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="bg-white border rounded-lg p-6 space-y-4"
      onSubmit={handleSubmit}
    >
      <h3 className="text-lg font-semibold">📝 휴가 신청</h3>

      <div>
        <label className="block text-sm mb-1">휴가 유형</label>
        <select
          className="w-full border px-3 py-2 rounded"
          value={form.type_code}
          onChange={(e) => setForm({ ...form, type_code: e.target.value })}
        >
          {types.length === 0 ? (
            <option>휴가 유형을 불러오는 중...</option>
          ) : (
            types.map((type) => (
              <option key={type.code} value={type.code}>
                {type.label}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm mb-1">시작일</label>
          <input
            type="date"
            className="w-full border px-3 py-2 rounded"
            min={today}
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm mb-1">종료일</label>
          <input
            type="date"
            className="w-full border px-3 py-2 rounded"
            min={today}
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">사유 (선택)</label>
        <textarea
          className="w-full border px-3 py-2 rounded"
          rows={3}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        disabled={submitting}
      >
        {submitting ? "처리 중..." : "신청하기"}
      </button>
    </form>
  );
};

export default VacationForm;
