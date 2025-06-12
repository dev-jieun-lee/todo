// App.tsx
import { BrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AppRoutes from "./routes/AppRoutes";
import { UserProvider } from "./contexts/UserProvider"; // 로그인 정보 공유용
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CommonCodeProvider } from "./contexts/CommonCodeContext";

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <CommonCodeProvider>
          <MainLayout>
            <AppRoutes />
            <ToastContainer position="top-center" autoClose={3000} />
          </MainLayout>
        </CommonCodeProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
