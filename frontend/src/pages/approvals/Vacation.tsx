import { useState, useEffect } from "react";
import VacationForm from "./VacationForm";
import MyVacationList from "../Calendar/MyVacationList";
import LeaveSummaryCard from "../profile/LeaveSummaryCard";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import useCommonCodeMap from "../../hooks/useCommonCodeMap";
import type { VacationDetail } from "../../types/types";

const Vacation = () => {
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [vacations, setVacations] = useState<VacationDetail[]>([]);

  const { commonCodeMap } = useCommonCodeMap(["VACATION_TYPE", "POSITION"]);

  const handleSubmitted = () => {
    setRefreshFlag((prev) => !prev);
  };

  useEffect(() => {
    api
      .get<VacationDetail[]>("/vacations/my")
      .then((res) => setVacations(res.data))
      .catch((err) => {
        console.error("휴가 목록 불러오기 실패:", err);
        toast.error("휴가 목록을 불러오지 못했습니다.");
      });
  }, [refreshFlag]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">🌴 연차 / 병가 신청 및 현황</h2>
      <p className="text-gray-600 mb-4">
        휴가를 신청하고 승인 상태를 확인할 수 있습니다.
      </p>

      <LeaveSummaryCard compact />

      <hr className="my-6" />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* 왼쪽: 신청 폼 */}
        <div className="w-full lg:w-1/2 min-h-[32rem] max-h-[32rem]">
          <VacationForm
            onSubmitted={handleSubmitted}
            className="h-full"
            vacations={vacations}
            commonCodeMap={commonCodeMap}
          />
        </div>

        {/* 오른쪽: 신청 내역 */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white border rounded-lg p-6 h-[32rem] overflow-y-auto">
            <MyVacationList
              key={refreshFlag ? "list1" : "list2"}
              codeMap={Object.fromEntries(
                (commonCodeMap["VACATION_TYPE"] || []).map((c) => [
                  c.code,
                  c.label,
                ])
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vacation;
