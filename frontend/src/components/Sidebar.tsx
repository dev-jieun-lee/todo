import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { path: "/dashboard", label: "📊 대시보드" },
  { path: "/todo/my", label: "✅ 내 할 일" },
  { path: "/calendar", label: "📅 공용 캘린더" },
  { path: "/kpi/my", label: "📁 성과 관리" },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white h-screen border-r px-6 py-8 shadow-sm">
      <h1 className="text-2xl font-bold mb-8">그룹웨어</h1>
      <nav className="flex flex-col gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-base font-medium hover:text-blue-600 ${
              location.pathname.startsWith(item.path)
                ? "text-blue-600"
                : "text-gray-800"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
