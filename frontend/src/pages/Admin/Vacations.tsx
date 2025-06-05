import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
// import { toast } from "react-toastify";
import { handleApiError } from "../../utils/handleErrorFront";
import useCommonCodeMap from "../../hooks/useCommonCodeMap";
import type { ApprovalVacation } from "../../types/types";

const Vacations = () => {
  const [vacations, setVacations] = useState<ApprovalVacation[]>([]);
  const { commonCodeMap } = useCommonCodeMap([
    "VACATION_TYPE",
    "APPROVAL_STATUS",
    "POSITION",
    "DEPARTMENT",
    "DURATION_UNIT",
  ]);

  const fetchVacations = async () => {
    try {
      const res = await api.get<ApprovalVacation[]>("/approvals/pending", {
        params: { target_type: "vacation" },
      });
      setVacations(res.data);
    } catch (err) {
      handleApiError(err, "휴가 요청 목록 불러오기 실패");
    }
  };

  // const handleApprove = async (id: number) => {
  //   try {
  //     await api.post(`/approvals/vacation/${id}/approve`);
  //     toast.success("승인 완료");
  //     fetchVacations();
  //   } catch (err) {
  //     handleApiError(err, "휴가 승인 처리 중 오류 발생");
  //   }
  // };

  // const handleReject = async (id: number) => {
  //   try {
  //     await api.post(`/approvals/vacation/${id}/reject`, { memo: "반려 사유" });
  //     toast.success("반려 완료");
  //     fetchVacations();
  //   } catch (err) {
  //     handleApiError(err, "휴가 반려 처리 중 오류 발생");
  //   }
  // };

  useEffect(() => {
    fetchVacations();
  }, []);

  const getLabel = (group: string, code: string | undefined) =>
    code
      ? commonCodeMap[group]?.find((c) => c.code === code)?.label || code
      : "-";

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🛂 휴가 승인 / 계정 잠금</h2>
      <p className="text-gray-600 mb-4">휴가 요청 승인 처리를 진행합니다.</p>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2">사용자</th>
            <th className="p-2">유형</th>
            <th className="p-2">기간</th>
            <th className="p-2">상태</th>
            <th className="p-2">승인자</th>
            <th className="p-2">처리</th>
          </tr>
        </thead>
        <tbody>
          {vacations.map((v) => (
            <tr key={v.id} className="border-t">
              <td className="p-2">
                {(v.name ?? "-") + " (" + (v.username ?? "-") + ")"}
              </td>
              <td className="p-2">{getLabel("VACATION_TYPE", v.type_code)}</td>
              <td className="p-2">
                {v.start_date} ~ {v.end_date}
                {v.duration_unit === "HOUR" && v.start_time && v.end_time && (
                  <div className="text-xs text-gray-500">
                    ⏰ {v.start_time}~{v.end_time}
                  </div>
                )}
                {v.duration_unit === "HALF" && v.start_time && (
                  <div className="text-xs text-gray-500">
                    ({v.start_time === "09:00" ? "오전 반차" : "오후 반차"})
                  </div>
                )}
                {v.duration_unit === "FULL" && (
                  <div className="text-xs text-gray-400">
                    ({getLabel("DURATION_UNIT", v.duration_unit)})
                  </div>
                )}
              </td>
              <td className="p-2">{getLabel("APPROVAL_STATUS", v.status)}</td>
              <td className="p-2">
                {v.approver_name
                  ? `${v.approver_name} (${getLabel(
                      "POSITION",
                      v.approver_position
                    )} / ${getLabel("DEPARTMENT", v.approver_dept)})`
                  : "-"}
              </td>
              <td className="p-2">
                {/* {v.status === "PENDING" ? (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleApprove(v.target_id)}
                      className="text-green-600 hover:underline"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(v.target_id)}
                      className="text-red-600 hover:underline"
                    >
                      반려
                    </button>
                  </div>
                ) : (
                  "-"
                )} */}
                {"-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Vacations;
