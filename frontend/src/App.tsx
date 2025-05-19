// App.tsx
import { BrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AppRoutes from "./routes/AppRoutes";
import { UserProvider } from "./contexts/UserProvider"; // 로그인 정보 공유용

function App() {
  return (
    <BrowserRouter>
      {" "}
      {/* 주소로 페이지 바꾸기 */}
      <UserProvider>
        {" "}
        {/*  전역 사용자 상태 관리  */}
        <MainLayout>
          {" "}
          {/* Header + Sidebar 포함한 큰 틀 */}
          <AppRoutes /> {/* 각각의 페이지 이동 설정 */}
        </MainLayout>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
