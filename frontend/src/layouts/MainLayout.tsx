import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) return <>{children}</>; // 로그인 페이지는 Layout 제외

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
