import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Todo from "../pages/Todo";
import Calendar from "../pages/Calendar";
import KPI from "../pages/KPI";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/todo/my" element={<Todo />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/kpi/my" element={<KPI />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
};

export default AppRoutes;
