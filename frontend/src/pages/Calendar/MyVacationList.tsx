import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { logEvent } from "../../utils/logger";

interface Vacation {
  id: number;
  type_code: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
  created_at: string;
}

const MyVacationList = () => {
  const [vacations, setVacations] = useState<Vacation[]>([]);

  useEffect(() => {
    api
      .get("/vacations/my")
      .then((res) => {
        setVacations(res.data);
        logEvent("✅ 내 휴가 이력 불러오기 완료");
      })
      .catch((err) => {
        console.error("❌ 내 휴가 이력 불러오기 실패:", err);
        logEvent("❌ 내 휴가 이력 불러오기 실패");
      });
  }, []);

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">📋 신청 내역</h3>
      {vacations.length === 0 ? (
        <p className="text-sm text-gray-500">아직 신청한 휴가가 없습니다.</p>
      ) : (
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2">기간</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">사유</th>
              <th className="px-3 py-2">신청일</th>
            </tr>
          </thead>
          <tbody>
            {vacations.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-3 py-2">{v.type_code}</td>
                <td className="px-3 py-2">
                  {v.start_date} ~ {v.end_date}
                </td>
                <td className="px-3 py-2">{v.status}</td>
                <td className="px-3 py-2">{v.reason || "-"}</td>
                <td className="px-3 py-2">{v.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyVacationList;
