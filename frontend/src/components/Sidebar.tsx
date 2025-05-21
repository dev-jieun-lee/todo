import { useEffect, useState, type JSX } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useUser } from "../contexts/useUser";
import { checkAccess } from "../utils/checkAccess";
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
import type { RoleType } from "../contexts/types";

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
  roles?: RoleType[] | string;
  parent_id?: number | null;
  children?: MenuItem[];
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, role } = useUser();

  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await api.get("/menus");
        const rawTree: MenuItem[] = res.data;

        // roles 파싱 + icon 매핑
        const parsedTree: MenuItem[] = rawTree.map((item: MenuItem) => {
          const parsedRoles =
            typeof item.roles === "string"
              ? JSON.parse(item.roles)
              : item.roles;

          const parsedChildren = item.children?.map((child: MenuItem) => ({
            ...child,
            roles:
              typeof child.roles === "string"
                ? JSON.parse(child.roles)
                : child.roles,
          }));

          return {
            ...item,
            icon:
              typeof item.icon === "string" ? iconMap[item.icon] : item.icon,
            roles: parsedRoles,
            children: parsedChildren,
          };
        });

        // role 필터링
        const visibleMenus = parsedTree
          .filter((item) => {
            const parsedRoles =
              typeof item.roles === "string"
                ? (JSON.parse(item.roles) as RoleType[])
                : item.roles;
            return checkAccess(role, parsedRoles);
          })
          .map((parent) => {
            const parsedChildren = parent.children?.map((child) => {
              const parsedChildRoles =
                typeof child.roles === "string"
                  ? (JSON.parse(child.roles) as RoleType[])
                  : child.roles;
              return {
                ...child,
                roles: parsedChildRoles,
              };
            });

            return {
              ...parent,
              children: parsedChildren?.filter((child) =>
                checkAccess(role, child.roles)
              ),
            };
          });
        setFilteredMenuItems(visibleMenus);
      } catch (err) {
        console.error("❌ 메뉴 로딩 실패:", err);
      }
    };

    fetchMenus();
  }, []);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleMenuClick = async (label: string, path: string) => {
    try {
      await api.post("/log/menu-access", { label, path });
    } catch (err) {
      console.warn("❗ 메뉴 접근 로그 실패:", err);
    }

    if (location.pathname !== path) {
      navigate(path);
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
    <aside className="w-64 bg-white h-screen border-r px-6 py-6 shadow-sm overflow-y-auto">
      <div className="text-xs text-gray-500 mb-2">환영합니다, {username}님</div>

      <button
        onClick={() => handleMenuClick("홈", "/")}
        className="text-2xl font-bold mb-4 block text-left"
      >
        그룹웨어
      </button>

      <input
        type="text"
        placeholder="메뉴 검색..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 mb-6 text-sm border rounded-md"
      />

      <nav className="flex flex-col gap-4">
        {displayedItems.map((item) =>
          item.children?.length ? (
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
                  {item.children.map(
                    (child) =>
                      child.path && (
                        <button
                          key={child.path}
                          onClick={() =>
                            handleMenuClick(child.label, child.path!)
                          }
                          className={`text-left text-sm hover:text-blue-600 ${
                            location.pathname.startsWith(child.path)
                              ? "text-blue-600 font-medium"
                              : "text-gray-800"
                          }`}
                        >
                          {child.label}
                        </button>
                      )
                  )}
                </div>
              )}
            </div>
          ) : item.path ? (
            <button
              key={item.path}
              onClick={() => handleMenuClick(item.label, item.path!)}
              className={`text-left text-sm font-medium hover:text-blue-600 ${
                location.pathname.startsWith(item.path)
                  ? "text-blue-600"
                  : "text-gray-800"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ) : null
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
