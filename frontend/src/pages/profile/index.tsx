import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { handleApiError } from "../../utils/handleErrorFront";
import { UserCircle, Lock, Mail, Clock } from "lucide-react";
import { Button } from "../../components/ui/button";

interface Profile {
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
  employee_number?: string;
  last_login?: string;
}

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/my-profile-details")
      .then((res) => setProfile(res.data))
      .catch((err) => {
        handleApiError(err, "내 정보 조회에 실패했습니다.");
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="p-6 text-sm text-gray-500">⏳ 불러오는 중...</div>;
  if (!profile)
    return (
      <div className="p-6 text-sm text-red-500">
        ❌ 내 정보를 불러오지 못했습니다.
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* 상단 요약 카드 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <UserCircle className="w-10 h-10 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">
            {profile.name} ({profile.position})
          </h2>
          <p className="text-sm text-gray-600">
            {profile.department} / {profile.role}
          </p>
          <p className="text-sm text-gray-600">{profile.email}</p>
          {profile.last_login && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 최근 로그인: {profile.last_login}
            </p>
          )}
        </div>
      </div>

      {/* 상세 정보 카드 */}
      <div className="bg-gray-50 border rounded-lg p-6 text-sm text-gray-700 space-y-4">
        <div className="grid grid-cols-2 gap-y-3">
          <div>
            <strong>아이디:</strong> {profile.username}
          </div>
          <div>
            <strong>사번:</strong> {profile.employee_number || "-"}
          </div>
          <div>
            <strong>부서:</strong> {profile.department}
          </div>
          <div>
            <strong>직책:</strong> {profile.position}
          </div>
          <div>
            <strong>팀:</strong> {profile.team || "-"}
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

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              // 페이지 이동 방식
              window.location.href = "/profile/change-password";
            }}
          >
            <Lock className="w-4 h-4" /> 비밀번호 변경
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() =>
              window.open(
                "mailto:admin@company.com?subject=정보 수정 요청",
                "_blank"
              )
            }
          >
            <Mail className="w-4 h-4" /> 정보 수정 요청
          </Button>
        </div>
      </div>
    </div>
  );
}
