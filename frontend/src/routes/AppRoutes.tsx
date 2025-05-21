import { Routes, Route, Navigate } from "react-router-dom";

//진입페이지
import Home from "../pages";
import Login from "../pages/login";
import ProtectedRoute from "../routes/ProtectedRoute";

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

// 업무 게시판
import BoardFree from "../pages/Board/Free";
import BoardTeam from "../pages/Board/Team";
import BoardProject from "../pages/Board/Project";

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
import AdminSessionsPage from "../pages/Admin/Sessions";

//내정보
import MyProfilePage from "../pages/profile";
import MySessionsPage from "../pages/profile/sessions";

//에러
import Error403 from "../pages/error/403";
import Error404 from "../pages/error/404";

const AppRoutes = () => {
  return (
    <Routes>
      {/* 로그인 페이지는 누구나 접근 가능 */}
      <Route path="/login" element={<Login />} />
      {/* 진입페이지 (로그인 필요) */}
      <Route path="/" element={<ProtectedRoute element={<Home />} />} />
      {/* 기본 대시보드 */}
      <Route
        path="/dashboard/today"
        element={<ProtectedRoute element={<Today />} />}
      />
      <Route
        path="/dashboard/kpi"
        element={<ProtectedRoute element={<DashboardKpi />} />}
      />
      <Route
        path="/dashboard/notice"
        element={<ProtectedRoute element={<DashboardNotice />} />}
      />
      <Route
        path="/dashboard/vacation"
        element={<ProtectedRoute element={<DashboardVacation />} />}
      />
      {/* KPI */}
      <Route path="/kpi/my" element={<ProtectedRoute element={<KpiMy />} />} />
      <Route
        path="/kpi/team"
        element={<ProtectedRoute element={<KpiTeam />} />}
      />
      <Route
        path="/kpi/summary"
        element={<ProtectedRoute element={<KpiSummary />} />}
      />
      {/* 실행 관리 */}
      <Route
        path="/todo/my"
        element={<ProtectedRoute element={<MyTodo />} />}
      />
      <Route
        path="/todo/team"
        element={<ProtectedRoute element={<TodoTeam />} />}
      />
      <Route
        path="/todo/status"
        element={<ProtectedRoute element={<TodoStatus />} />}
      />
      <Route
        path="/todo/history"
        element={<ProtectedRoute element={<TodoHistory />} />}
      />
      {/* 업무 게시판 */}
      <Route
        path="/board/free"
        element={<ProtectedRoute element={<BoardFree />} />}
      />
      <Route
        path="/board/team"
        element={<ProtectedRoute element={<BoardTeam />} />}
      />
      <Route
        path="/board/project"
        element={<ProtectedRoute element={<BoardProject />} />}
      />
      {/* 캘린더 */}
      <Route
        path="/calendar/team"
        element={<ProtectedRoute element={<CalendarTeam />} />}
      />
      <Route
        path="/calendar/deploy"
        element={<ProtectedRoute element={<CalendarDeploy />} />}
      />
      <Route
        path="/calendar/meeting"
        element={<ProtectedRoute element={<CalendarMeeting />} />}
      />
      <Route
        path="/calendar/vacation"
        element={<ProtectedRoute element={<CalendarVacation />} />}
      />
      <Route
        path="/calendar/deadline"
        element={<ProtectedRoute element={<CalendarDeadline />} />}
      />
      {/* 공지 */}
      <Route
        path="/notice/global"
        element={<ProtectedRoute element={<NoticeGlobal />} />}
      />
      <Route
        path="/notice/team"
        element={<ProtectedRoute element={<NoticeTeam />} />}
      />
      <Route
        path="/notice/suggestion"
        element={<ProtectedRoute element={<NoticeSuggestion />} />}
      />
      {/* 관리자 */}
      <Route
        path="/admin/users"
        element={<ProtectedRoute element={<AdminUsers />} />}
      />
      <Route
        path="/admin/roles"
        element={<ProtectedRoute element={<AdminRoles />} />}
      />
      <Route
        path="/admin/vacations"
        element={<ProtectedRoute element={<AdminVacations />} />}
      />
      <Route
        path="/admin/settings/categories"
        element={<ProtectedRoute element={<AdminSettingsCategories />} />}
      />
      <Route
        path="/admin/settings/calendar"
        element={<ProtectedRoute element={<AdminSettingsCalendar />} />}
      />
      <Route
        path="/admin/settings/reset"
        element={<ProtectedRoute element={<AdminSettingsReset />} />}
      />
      <Route
        path="/admin/settings/logs"
        element={
          <ProtectedRoute element={<AdminSettingsLogs />} requireAdmin={true} />
        }
      />
      <Route
        path="/admin/sessions"
        element={
          <ProtectedRoute element={<AdminSessionsPage />} requireAdmin={true} />
        }
      />
      {/* 내정보 */}
      <Route
        path="/profile"
        element={<ProtectedRoute element={<MyProfilePage />} />}
      />
      <Route
        path="/profile/sessions"
        element={<ProtectedRoute element={<MySessionsPage />} />}
      />
      {/* 에러 */}
      <Route path="/error/403" element={<Error403 />} />
      <Route path="/error/404" element={<Error404 />} />
      {/* fallback */}
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
};

export default AppRoutes;
