import { useEffect, useState, type JSX } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useUser } from "../contexts/useUser";
import { checkAccessByScope } from "../utils/checkAccess";
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
import { ChevronLeft, ChevronRight } from "lucide-react"; // 또는 원하는 아이콘

const iconMap: Record<string, JSX.Element> = {
  DashboardIcon: <DashboardIcon />,
  KpiIcon: <KpiIcon />,
  TodoIcon: <TodoIcon />,
  BoardIcon: <BoardIcon />,
  CalendarIcon: <CalendarIcon />,
  NoticeIcon: <NoticeIcon />,
  UserIcon: <UserIcon />,
  SettingsIcon: <SettingsIcon />,
};

type MenuItem = {
  id: number;
  label: string;
  path?: string;
  icon?: JSX.Element | string;
  scope_code?: string; // 핵심 필드
  parent_id?: number | null;
  children?: MenuItem[];
};

const Sidebar = ({
  isMobile,
  sidebarOpen,
  setSidebarOpen,
}: {
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, role } = useUser();

  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await api.get("/menus");
        const rawTree: MenuItem[] = res.data;

        const parsedTree = rawTree.map((item) => ({
          ...item,
          icon: typeof item.icon === "string" ? iconMap[item.icon] : item.icon,
        }));

        const visibleMenus = parsedTree
          .filter((item) => checkAccessByScope(role, item.scope_code))
          .map((parent) => ({
            ...parent,
            children: parent.children?.filter((child) =>
              checkAccessByScope(role, child.scope_code)
            ),
          }));

        //  console.log("최종 메뉴:", visibleMenus);
        setFilteredMenuItems(visibleMenus);
      } catch (err) {
        console.error("❌ 메뉴 로딩 실패:", err);
      }
    };

    fetchMenus();
  }, [role]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleMenuClick = async (label: string, path?: string) => {
    if (!path) return;

    try {
      await api.post("/log/menu-access", { label, path });
      if (location.pathname !== path) navigate(path);
      if (isMobile) setSidebarOpen(false);
    } catch (err) {
      console.warn("❗ 메뉴 접근 로그 실패:", err);
    }
  };

  const filterMenuItems = (items: MenuItem[]) =>
    items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.children?.some((child) =>
          child.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

  const displayedItems = filterMenuItems(filteredMenuItems);

  return (
    <aside
      className={`transition-all duration-300 z-50 h-full bg-white border-r shadow-sm
    ${isMobile ? "fixed top-0 left-0 w-64" : collapsed ? "w-16" : "w-64"}
    ${isMobile && !sidebarOpen ? "hidden" : ""}
    overflow-y-auto
  `}
    >
      {/* 접기 토글 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mb-6 text-gray-600 hover:text-blue-600 p-2"
        title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* 헤더 영역 */}
      {!collapsed && (
        <>
          <div className="text-xs text-gray-500 mb-2 px-4">
            환영합니다, {username}님
          </div>
          <input
            type="text"
            placeholder="메뉴 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 mb-6 text-sm border rounded-md"
          />
        </>
      )}

      {/* 메뉴 영역 */}
      <nav className="flex flex-col gap-4 px-2">
        {displayedItems.map((item) =>
          item.children?.length ? (
            <div key={item.label} className="relative group">
              <button
                className="w-full text-left text-sm font-semibold flex items-center gap-2 px-2 py-2 hover:text-blue-600"
                onClick={() => toggleMenu(item.label)}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && item.label}
              </button>

              {/* 하위 메뉴 분기 */}
              {isMobile ? (
                <div className="pl-4 mt-1 space-y-1">
                  {item.children.map((child) =>
                    typeof child.path === "string" ? (
                      <button
                        key={child.path}
                        onClick={() => handleMenuClick(child.label, child.path)}
                        className={`block w-full text-left text-sm hover:text-blue-600 ${
                          location.pathname.startsWith(child.path)
                            ? "text-blue-600 font-medium"
                            : "text-gray-800"
                        }`}
                      >
                        {child.label}
                      </button>
                    ) : null
                  )}
                </div>
              ) : collapsed ? (
                <div className="absolute left-full top-0 ml-2 w-48 bg-white border rounded shadow-md z-40 hidden group-hover:block">
                  {item.children.map((child) =>
                    child.path ? (
                      <button
                        key={child.path}
                        onClick={() => handleMenuClick(child.label, child.path)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                          location.pathname.startsWith(child.path)
                            ? "text-blue-600 font-medium"
                            : "text-gray-800"
                        }`}
                      >
                        {child.label}
                      </button>
                    ) : null
                  )}
                </div>
              ) : openMenus.includes(item.label) ? (
                <div className="flex flex-col gap-2 pl-6 mt-1">
                  {item.children.map((child) =>
                    child.path ? (
                      <button
                        key={child.path}
                        onClick={() => handleMenuClick(child.label, child.path)}
                        className={`text-left text-sm hover:text-blue-600 ${
                          location.pathname.startsWith(child.path)
                            ? "text-blue-600 font-medium"
                            : "text-gray-800"
                        }`}
                      >
                        {child.label}
                      </button>
                    ) : null
                  )}
                </div>
              ) : null}
            </div>
          ) : item.path ? (
            <button
              key={item.path}
              onClick={() => handleMenuClick(item.label, item.path)}
              className={`text-left text-sm font-medium hover:text-blue-600 flex items-center gap-2 px-2 py-2 ${
                location.pathname.startsWith(item.path)
                  ? "text-blue-600"
                  : "text-gray-800"
              }`}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && item.label}
            </button>
          ) : null
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
