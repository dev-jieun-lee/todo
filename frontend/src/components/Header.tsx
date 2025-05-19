import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

const Header = () => {
  const { logout, username, role } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="w-full bg-white shadow px-6 py-3 flex justify-between items-center border-b">
      {/* 좌측: 로고 */}
      <h1 className="text-xl font-bold text-gray-800">그룹웨어</h1>

      {/* 우측: 알림 + 프로필 + 로그아웃 */}
      <div className="flex items-center gap-6">
        {/* 알림 아이콘 */}
        <button
          onClick={() => alert("알림 기능은 아직 미구현입니다.")}
          className="relative"
        >
          <Bell className="w-5 h-5 text-gray-600 hover:text-blue-600 transition" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-2">
          {/* 프로필 이미지 (더미) */}
          <img
            src={`https://ui-avatars.com/api/?name=${username}&background=0D8ABC&color=fff&size=32`}
            alt="프로필"
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm text-gray-700">
            {username} ({role})
          </span>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:underline transition"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
};

export default Header;
