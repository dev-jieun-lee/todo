// src/pages/calendar/Vacation.tsx
import { useState, useEffect } from "react";
import VacationForm from "./VacationForm";
import MyVacationList from "./MyVacationList";
import LeaveSummaryCard from "../profile/LeaveSummaryCard";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
interface CommonCode {
  code: string;
  label: string;
}
const Vacation = () => {
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});

  const handleSubmitted = () => {
    setRefreshFlag((prev) => !prev);
  };

  useEffect(() => {
    Promise.all([
      api.get<CommonCode[]>("/common-codes?group=VACATION_TYPE"),
      api.get<CommonCode[]>("/common-codes?group=APPROVAL_STATUS"),
    ])
      .then(([vacRes, statusRes]) => {
        const map: Record<string, string> = {};

        vacRes.data.forEach((c) => (map[c.code] = c.label));
        statusRes.data.forEach((c) => (map[c.code] = c.label));

        setCodeMap(map);
      })
      .catch((err) => {
        console.error("공통 코드 불러오기 실패:", err);
        toast.error("공통코드를 불러오는 데 실패했습니다.");
      });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">🌴 연차 / 병가 신청 및 현황</h2>
      <p className="text-gray-600 mb-4">
        휴가를 신청하고 승인 상태를 확인할 수 있습니다.
      </p>

      <LeaveSummaryCard compact />
      {/* {/* <div className="my-4"> */}
      {/* <VacationForm onSubmitted={handleSubmitted} />
      </div>
      <MyVacationList key={refreshFlag ? "list1" : "list2"} codeMap={codeMap} /> */}
      <hr className="my-6" />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* 왼쪽: 신청 폼 */}
        <div className="w-full lg:w-1/2 min-h-[32rem] max-h-[32rem]">
          <VacationForm onSubmitted={handleSubmitted} className="h-full" />
        </div>

        {/* 오른쪽: 신청 내역 */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white border rounded-lg p-6 h-[32rem] overflow-y-auto">
            <MyVacationList
              key={refreshFlag ? "list1" : "list2"}
              codeMap={codeMap}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vacation;
