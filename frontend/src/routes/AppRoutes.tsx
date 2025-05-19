import { Routes, Route } from "react-router-dom";

//진입페이지
import Home from "../pages";

// 대시보드
import Today from "../pages/Dashboard/Today";
import DashboardKpi from "../pages/Dashboard/Kpi";
import DashboardNotice from "../pages/Dashboard/Notice";
import DashboardVacation from "../pages/Dashboard/Vacation";

// KPI
import KpiMy from "../pages/KPI/My";
import KpiTeam from "../pages/KPI/Team";
import KpiSummary from "../pages/KPI/Summary";

// 실행 관리
import MyTodo from "../pages/Todo/MyTodo";
import TodoTeam from "../pages/Todo/Team";
import TodoStatus from "../pages/Todo/Status";
import TodoHistory from "../pages/Todo/TodoHistory";

// 캘린더
import CalendarTeam from "../pages/Calendar/Team";
import CalendarDeploy from "../pages/Calendar/Deploy";
import CalendarMeeting from "../pages/Calendar/Meeting";
import CalendarVacation from "../pages/Calendar/Vacation";
import CalendarDeadline from "../pages/Calendar/Deadline";

// 공지
import NoticeGlobal from "../pages/Notice/Global";
import NoticeTeam from "../pages/Notice/Team";
import NoticeSuggestion from "../pages/Notice/Suggestion";

// 관리자
import AdminUsers from "../pages/Admin/Users";
import AdminRoles from "../pages/Admin/Roles";
import AdminVacations from "../pages/Admin/Vacations";
import AdminSettingsCategories from "../pages/Admin/Settings/Categories";
import AdminSettingsCalendar from "../pages/Admin/Settings/Calendar";
import AdminSettingsReset from "../pages/Admin/Settings/Reset";
import AdminSettingsLogs from "../pages/Admin/Settings/Logs";

const AppRoutes = () => {
  return (
    <Routes>
      {/* 진입페이지 */}
      <Route path="/" element={<Home />} />

      {/* 기본 대시보드 */}
      <Route path="/dashboard/today" element={<Today />} />
      <Route path="/dashboard/kpi" element={<DashboardKpi />} />
      <Route path="/dashboard/notice" element={<DashboardNotice />} />
      <Route path="/dashboard/vacation" element={<DashboardVacation />} />

      {/* KPI */}
      <Route path="/kpi/my" element={<KpiMy />} />
      <Route path="/kpi/team" element={<KpiTeam />} />
      <Route path="/kpi/summary" element={<KpiSummary />} />

      {/* 실행 관리 */}
      <Route path="/todo/my" element={<MyTodo />} />
      <Route path="/todo/team" element={<TodoTeam />} />
      <Route path="/todo/status" element={<TodoStatus />} />
      <Route path="/todo/history" element={<TodoHistory />} />

      {/* 캘린더 */}
      <Route path="/calendar/team" element={<CalendarTeam />} />
      <Route path="/calendar/deploy" element={<CalendarDeploy />} />
      <Route path="/calendar/meeting" element={<CalendarMeeting />} />
      <Route path="/calendar/vacation" element={<CalendarVacation />} />
      <Route path="/calendar/deadline" element={<CalendarDeadline />} />

      {/* 공지 */}
      <Route path="/notice/global" element={<NoticeGlobal />} />
      <Route path="/notice/team" element={<NoticeTeam />} />
      <Route path="/notice/suggestion" element={<NoticeSuggestion />} />

      {/* 관리자 */}
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/roles" element={<AdminRoles />} />
      <Route path="/admin/vacations" element={<AdminVacations />} />
      <Route
        path="/admin/settings/categories"
        element={<AdminSettingsCategories />}
      />
      <Route
        path="/admin/settings/calendar"
        element={<AdminSettingsCalendar />}
      />
      <Route path="/admin/settings/reset" element={<AdminSettingsReset />} />
      <Route path="/admin/settings/logs" element={<AdminSettingsLogs />} />

      {/* Fallback */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
};

export default AppRoutes;
