// 📅 공용 캘린더 > 연차 / 병가 신청 및 현황
import { useState } from "react";
import VacationForm from "./VacationForm";
import MyVacationList from "./MyVacationList";
import LeaveSummaryCard from "../profile/LeaveSummaryCard";

const Vacation = () => {
  const [refreshFlag, setRefreshFlag] = useState(false);

  const handleSubmitted = () => {
    setRefreshFlag((prev) => !prev);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">🌴 연차 / 병가 신청 및 현황</h2>
      <p className="text-gray-600 mb-4">
        휴가를 신청하고 승인 상태를 확인할 수 있습니다.
      </p>

      <LeaveSummaryCard compact />
      <div className="my-4">
        <VacationForm onSubmitted={handleSubmitted} />
      </div>
      <MyVacationList key={refreshFlag ? "list1" : "list2"} />
    </div>
  );
};

export default Vacation;
