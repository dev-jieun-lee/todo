import { useUser } from "../contexts/useUser";
import { useNavigate } from "react-router-dom";
import { Bell, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SessionTimer from "../components/SessionTimer";
import { Menu } from "lucide-react"; // 꼭 추가
import api from "../utils/axiosInstance";

const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { logout, username, role } = useUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleMenuClick = async (label: string, path?: string) => {
    if (!path) return;

    try {
      await api.post("/log/menu-access", { label, path });
    } catch (err) {
      console.warn("❗ 메뉴 접근 로그 실패:", err);
    }
  };
  return (
    <header className="w-full bg-white shadow px-6 py-3 flex justify-between items-center border-b relative">
      <button
        onClick={() => handleMenuClick("홈", "/")}
        className="text-2xl font-bold mb-4 block text-left px-4"
      >
        그룹웨어
      </button>
      {onMenuClick && (
        <button onClick={onMenuClick} className="md:hidden">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      )}
      <div className="flex items-center gap-6 relative">
        <button
          onClick={() => alert("알림 기능은 아직 미구현입니다.")}
          className="relative"
        >
          <Bell className="w-5 h-5 text-gray-600 hover:text-blue-600 transition" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
            3
          </span>
        </button>
        <div className="header-right">
          <SessionTimer />
        </div>
        {/* 사용자 프로필 + 드롭다운 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <UserCircle className="w-8 h-8 text-gray-600" />
            <span className="text-sm text-gray-700">
              {username} ({role})
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded text-sm z-50 border">
              <button
                onClick={() => {
                  navigate("/profile");
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                내 정보
              </button>
              <button
                onClick={() => {
                  navigate("/profile/sessions");
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                세션 관리
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
