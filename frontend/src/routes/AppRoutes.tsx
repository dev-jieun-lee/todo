import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import MyTodo from "../pages/Todo/MyTodo";
import TodoHistory from "../pages/Todo/TodoHistory";
import Calendar from "../pages/Calendar";
import KPI from "../pages/KPI";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/todo/my" element={<MyTodo />} />
      <Route path="/todo/history" element={<TodoHistory />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/kpi/my" element={<KPI />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
};

export default AppRoutes;
