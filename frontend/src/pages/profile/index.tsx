import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { handleApiError } from "../../utils/handleErrorFront";

type Profile = {
  username: string;
  name: string;
  email: string;
  role: string;
  department: string;
  position: string;
  team: string;
  status_label: string;
  hire_date: string;
  leave_date: string | null;
};

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/my-profile-details")
      .then((res) => {
        setProfile(res.data);
      })
      .catch((err) => {
        handleApiError(err, "내 정보 조회에 실패했습니다.");
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div className="p-6 text-sm text-gray-500">⏳ 불러오는 중...</div>;

  if (!profile)
    return (
      <div className="p-6 text-sm text-red-500">
        ❌ 내 정보를 불러오지 못했습니다. 관리자에게 문의해주세요.
      </div>
    );

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4 text-sm text-gray-700">
      <h2 className="text-2xl font-bold mb-4">🙋 내 정보</h2>
      <div>
        <strong>이름:</strong> {profile.name}
      </div>
      <div>
        <strong>아이디:</strong> {profile.username}
      </div>
      <div>
        <strong>이메일:</strong> {profile.email}
      </div>
      <div>
        <strong>권한:</strong> {profile.role}
      </div>
      <div>
        <strong>부서:</strong> {profile.department}
      </div>
      <div>
        <strong>직책:</strong> {profile.position}
      </div>
      <div>
        <strong>팀:</strong> {profile.team}
      </div>
      <div>
        <strong>입사일:</strong> {profile.hire_date}
      </div>
      {profile.leave_date && (
        <div>
          <strong>퇴사일:</strong> {profile.leave_date}
        </div>
      )}
      <div>
        <strong>상태:</strong> {profile.status_label}
      </div>
    </div>
  );
}
