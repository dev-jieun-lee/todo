import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";

interface LeaveSummary {
  remaining: number;
  usedThisMonth: number;
  expireDate: string;
}

export default function LeaveSummaryCard({ compact = false }) {
  const [data, setData] = useState<LeaveSummary | null>(null);

  useEffect(() => {
    api
      .get("/profile/leave-summary")
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error("연차 요약 조회 실패", err);
        toast.error("연차 요약을 불러오는 데 실패했습니다.");
      });
  }, []);
  if (!data) return null;

  return compact ? (
    <div className="bg-white border rounded-lg px-4 py-3 text-sm flex gap-6 justify-between items-center">
      <span>
        남은 연차 <br />
        <strong className="text-lg">{data.remaining}일</strong>
      </span>
      <span>
        이번 달 사용 <br />
        <strong className="text-lg">{data.usedThisMonth}일</strong>
      </span>
      <span>
        소멸일 <br />
        <strong className="text-lg">{data.expireDate}</strong>
      </span>
    </div>
  ) : (
    <div className="bg-white p-5 rounded-lg border text-sm">
      <h3 className="font-semibold mb-3">🏖 연차 요약</h3>
      <ul className="space-y-1">
        <li>
          남은 연차: <strong>{data.remaining}일</strong>
        </li>
        <li>
          이번 달 사용: <strong>{data.usedThisMonth}일</strong>
        </li>
        <li>
          소멸일: <strong>{data.expireDate}</strong>
        </li>
      </ul>
    </div>
  );
}
