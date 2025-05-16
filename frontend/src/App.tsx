// ✅ App.tsx
import { BrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <AppRoutes /> {/* ✅ 모든 Route는 이 안에서 처리됨 */}
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
