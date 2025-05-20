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
import { useUser } from "../contexts/useUser";
import { checkAccess } from "../utils/checkAccess";
import type { RoleType } from "../contexts/types";
// 메뉴 타입 정의
type MenuItem = {
  id: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  roles?: RoleType[];
};

// 전체 메뉴 정의
const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "대시보드",
    icon: <DashboardIcon />,
    children: [
      {
        id: "dashboard-today",
        path: "/dashboard/today",
        label: "오늘 할 일 요약",
      },
      { id: "dashboard-kpi", path: "/dashboard/kpi", label: "KPI 달성률" },
      {
        id: "dashboard-notice",
        path: "/dashboard/notice",
        label: "공지사항 / 일정 알림",
      },
      {
        id: "dashboard-vacation",
        path: "/dashboard/vacation",
        label: "휴가 중인 인원",
      },
    ],
  },
  {
    id: "kpi",
    label: "성과 관리 (KPI)",
    icon: <KpiIcon />,
    children: [
      { id: "kpi-my", path: "/kpi/my", label: "내 KPI 기록" },
      { id: "kpi-team", path: "/kpi/team", label: "팀별 목표 설정 (OKR)" },
      {
        id: "kpi-summary",
        path: "/kpi/summary",
        label: "KPI 달성 현황판 (그래프, 리포트)",
      },
    ],
  },
  {
    id: "todo",
    label: "실행 관리",
    icon: <TodoIcon />,
    children: [
      { id: "todo-my", path: "/todo/my", label: "나의 실행 계획 (To-do)" },
      { id: "todo-team", path: "/todo/team", label: "팀 단위 체크리스트" },
      {
        id: "todo-status",
        path: "/todo/status",
        label: "상태별 보기 (예정 / 완료 / 중단)",
      },
    ],
  },
  {
    id: "board",
    label: "업무 게시판",
    icon: <BoardIcon />,
    children: [
      { id: "board-free", path: "/board/free", label: "자유 게시판" },
      { id: "board-team", path: "/board/team", label: "팀별 공유 게시판" },
      {
        id: "board-project",
        path: "/board/project",
        label: "프로젝트별 회의록 / 자료실",
      },
    ],
  },
  {
    id: "calendar",
    label: "공용 캘린더",
    icon: <CalendarIcon />,
    children: [
      {
        id: "calendar-team",
        path: "/calendar/team",
        label: "팀 일정 보기 (주간/월간)",
      },
      {
        id: "calendar-deploy",
        path: "/calendar/deploy",
        label: "배포 일정 관리",
      },
      {
        id: "calendar-meeting",
        path: "/calendar/meeting",
        label: "회의 / 외근 / 교육 일정",
      },
      {
        id: "calendar-vacation",
        path: "/calendar/vacation",
        label: "연차 / 반차 / 병가 신청 및 현황",
      },
      {
        id: "calendar-deadline",
        path: "/calendar/deadline",
        label: "개인 KPI / TODO 마감일 연동",
      },
    ],
  },
  {
    id: "notice",
    label: "공지 / 소통",
    icon: <NoticeIcon />,
    children: [
      { id: "notice-global", path: "/notice/global", label: "공지사항" },
      {
        id: "notice-team",
        path: "/notice/team",
        label: "팀 공지 (역할별 가시성 설정)",
      },
      {
        id: "notice-suggestion",
        path: "/notice/suggestion",
        label: "익명 제안함 (선택)",
      },
    ],
  },
  {
    id: "admin-users",
    label: "사용자 / 권한 관리 (관리자)",
    icon: <UserIcon />,
    roles: ["ADMIN"],
    children: [
      {
        id: "admin-users-list",
        path: "/admin/users",
        label: "사용자 목록 및 초대",
      },
      {
        id: "admin-roles",
        path: "/admin/roles",
        label: "역할 및 접근 권한 설정",
      },
      {
        id: "admin-vacations",
        path: "/admin/vacations",
        label: "휴가 승인 / 계정 잠금",
      },
    ],
  },
  {
    id: "admin-settings",
    label: "시스템 설정 (관리자)",
    icon: <SettingsIcon />,
    roles: ["ADMIN"],
    children: [
      {
        id: "admin-settings-categories",
        path: "/admin/settings/categories",
        label: "업무/KPI 카테고리 설정",
      },
      {
        id: "admin-settings-calendar",
        path: "/admin/settings/calendar",
        label: "캘린더 색상/태그 설정",
      },
      {
        id: "admin-settings-reset",
        path: "/admin/settings/reset",
        label: "초기화 및 백업",
      },
      {
        id: "admin-settings-logs",
        path: "/admin/settings/logs",
        label: "로그 기록 / 시스템 상태",
      },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { username, role } = useUser();
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

  const filteredMenuItems = filterMenuItems(menuItems).filter((item) => {
    return checkAccess(role, item.roles);
  });

  return (
    <aside className="w-64 bg-white h-screen border-r px-6 py-6 shadow-sm overflow-y-auto">
      <div className="text-xs text-gray-500 mb-2">환영합니다, {username}님</div>

      <Link to="/" className="text-2xl font-bold mb-4 block">
        그룹웨어
      </Link>

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
