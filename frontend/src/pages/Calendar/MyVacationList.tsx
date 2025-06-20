// src/pages/calendar/MyVacationList.tsx
// 📅 내 휴가 목록 페이지
// 이 컴포넌트는 로그인 사용자의 휴가 신청 내역을 표로 보여주고, 취소 기능을 제공합니다.
import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { logEvent } from "../../utils/logger";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import type { VacationDetail } from "../../types/vacation";
interface MyVacationListProps {
  codeMap: Record<string, string>;
}

const MyVacationList = ({ codeMap }: MyVacationListProps) => {
  const [vacations, setVacations] = useState<VacationDetail[]>([]);

  useEffect(() => {
    api
      .get("/vacations/my")
      .then((res) => {
        setVacations(res.data);
        logEvent("내 휴가 이력 불러오기 완료");
      })
      .catch((err) => {
        console.error("❌ 내 휴가 이력 불러오기 실패:", err);
        toast.error("휴가 이력을 불러오는 데 실패했습니다.");
      });
  }, []);

  const handleCancel = async (id: number) => {
    try {
      await api.post(`/vacations/cancel/${id}`);
      toast.success("휴가 신청이 취소되었습니다.");
      logEvent(`🗑 휴가 신청 취소 처리: ID ${id}`);

      // 최신 이력 다시 불러오기
      const res = await api.get("/vacations/my");
      setVacations(res.data);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError;
      console.error("❌ 휴가 취소 실패:", axiosErr);
      toast.error("휴가 취소에 실패했습니다.");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 제목: 고정 영역 */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold">📋 신청 내역</h3>
      </div>

      {/* 테이블 전체를 scrollable 영역으로 */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead className="sticky top-0 z-10 bg-white border-b">
            <tr className="text-left bg-gray-100">
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2">기간</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">사유</th>
              <th className="px-3 py-2">신청일</th>
              <th className="px-3 py-2">관리</th>
            </tr>
          </thead>
          <tbody>
            {vacations.map((v) => (
              <tr
                key={v.id}
                className={`border-t ${
                  v.status === "취소완료" ? "text-gray-400 italic" : ""
                }`}
              >
                <td className="px-3 py-2">
                  {codeMap[v.type_code] || v.type_code}
                </td>
                <td className="px-3 py-2">
                  {v.start_date === v.end_date
                    ? v.start_date
                    : `${v.start_date} ~ ${v.end_date}`}

                  {v.duration_unit === "HOUR" ? (
                    <div className="text-xs text-gray-500">
                      ⏰ {v.start_time} ~ {v.end_time}
                    </div>
                  ) : v.duration_unit === "HALF" ? (
                    <div className="text-xs text-gray-500">
                      ({v.start_time === "09:00" ? "오전 반차" : "오후 반차"})
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      v.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : v.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : v.status === "CANCELLED"
                        ? "bg-gray-200 text-gray-500 italic"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {codeMap[v.status] || v.status}
                  </span>
                </td>

                <td className="px-3 py-2">{v.reason || "-"}</td>
                <td className="px-3 py-2">
                  {v.created_at ? v.created_at.slice(0, 10) : "-"}
                </td>
                <td className="px-3 py-2">
                  {v.status === "PENDING" ? (
                    <button
                      onClick={() => handleCancel(v.id)}
                      className="text-red-600 hover:underline"
                    >
                      취소
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyVacationList;
