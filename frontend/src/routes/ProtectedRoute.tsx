//	로그인 및 권한 분기 제어
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const ProtectedRoute = ({
  element,
  requireAdmin = false,
}: {
  element: React.ReactElement;
  requireAdmin?: boolean;
}) => {
  const { token, role } = useUser();

  if (!token) return <Navigate to="/login" />;
  if (requireAdmin && role !== "admin") return <Navigate to="/error/403" />;

  return element;
};

export default ProtectedRoute;
