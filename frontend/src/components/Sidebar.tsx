import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  DashboardIcon,
  KpiIcon,
  TodoIcon,
  BoardIcon,
  CalendarIcon,
  NoticeIcon,
  UserIcon,
  SettingsIcon,
} from "./Icons";

// 메뉴 타입 정의
type MenuItem = {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
};

// 전체 메뉴 정의
const menuItems: MenuItem[] = [
  {
    label: "대시보드",
    icon: <DashboardIcon />,
    children: [
      { path: "/dashboard/today", label: "오늘 할 일 요약" },
      { path: "/dashboard/kpi", label: "KPI 달성률" },
      { path: "/dashboard/notice", label: "공지사항 / 일정 알림" },
      { path: "/dashboard/vacation", label: "휴가 중인 인원" },
    ],
  },
  {
    label: "성과 관리 (KPI)",
    icon: <KpiIcon />,
    children: [
      { path: "/kpi/my", label: "내 KPI 기록" },
      { path: "/kpi/team", label: "팀별 목표 설정 (OKR)" },
      { path: "/kpi/summary", label: "KPI 달성 현황판 (그래프, 리포트)" },
    ],
  },
  {
    label: "실행 관리",
    icon: <TodoIcon />,
    children: [
      { path: "/todo/my", label: "나의 실행 계획 (To-do)" },
      { path: "/todo/team", label: "팀 단위 체크리스트" },
      { path: "/todo/status", label: "상태별 보기 (예정 / 완료 / 중단)" },
    ],
  },
  {
    label: "업무 게시판",
    icon: <BoardIcon />,
    children: [
      { path: "/board/free", label: "자유 게시판" },
      { path: "/board/team", label: "팀별 공유 게시판" },
      { path: "/board/project", label: "프로젝트별 회의록 / 자료실" },
    ],
  },
  {
    label: "공용 캘린더",
    icon: <CalendarIcon />,
    children: [
      { path: "/calendar/team", label: "팀 일정 보기 (주간/월간)" },
      { path: "/calendar/deploy", label: "배포 일정 관리" },
      { path: "/calendar/meeting", label: "회의 / 외근 / 교육 일정" },
      { path: "/calendar/vacation", label: "연차 / 반차 / 병가 신청 및 현황" },
      { path: "/calendar/deadline", label: "개인 KPI / TODO 마감일 연동" },
    ],
  },
  {
    label: "공지 / 소통",
    icon: <NoticeIcon />,
    children: [
      { path: "/notice/global", label: "공지사항" },
      { path: "/notice/team", label: "팀 공지 (역할별 가시성 설정)" },
      { path: "/notice/suggestion", label: "익명 제안함 (선택)" },
    ],
  },
  {
    label: "사용자 / 권한 관리 (관리자)",
    icon: <UserIcon />,
    children: [
      { path: "/admin/users", label: "사용자 목록 및 초대" },
      { path: "/admin/roles", label: "역할 및 접근 권한 설정" },
      { path: "/admin/vacations", label: "휴가 승인 / 계정 잠금" },
    ],
  },
  {
    label: "시스템 설정 (관리자)",
    icon: <SettingsIcon />,
    children: [
      { path: "/admin/settings/categories", label: "업무/KPI 카테고리 설정" },
      { path: "/admin/settings/calendar", label: "캘린더 색상/태그 설정" },
      { path: "/admin/settings/reset", label: "초기화 및 백업" },
      { path: "/admin/settings/logs", label: "로그 기록 / 시스템 상태" },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const filterMenuItems = (items: MenuItem[]) =>
    items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.children?.some((child) =>
          child.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

  const filteredMenuItems = filterMenuItems(menuItems);

  return (
    <aside className="w-64 bg-white h-screen border-r px-6 py-6 shadow-sm overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">그룹웨어</h1>

      {/* 🔍 메뉴 검색 */}
      <input
        type="text"
        placeholder="메뉴 검색..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 mb-6 text-sm border rounded-md"
      />

      <nav className="flex flex-col gap-4">
        {filteredMenuItems.map((item) =>
          item.children ? (
            <div key={item.label}>
              <button
                className={`w-full text-left text-sm font-semibold transition-colors duration-200 ${
                  openMenus.includes(item.label)
                    ? "text-blue-600"
                    : "text-gray-600"
                }`}
                onClick={() => toggleMenu(item.label)}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </div>
              </button>
              {openMenus.includes(item.label) && (
                <div className="flex flex-col gap-2 pl-6 mt-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path!}
                      className={`text-sm hover:text-blue-600 ${
                        location.pathname.startsWith(child.path!)
                          ? "text-blue-600 font-medium"
                          : "text-gray-800"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              key={item.path}
              to={item.path!}
              className={`text-sm font-medium hover:text-blue-600 ${
                location.pathname.startsWith(item.path!)
                  ? "text-blue-600"
                  : "text-gray-800"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          )
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
