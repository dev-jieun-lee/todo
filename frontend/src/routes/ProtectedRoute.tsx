import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/useUser";
import { checkAccess } from "../utils/checkAccess";

const ProtectedRoute = ({
  element,
  requireAdmin = false,
}: {
  element: React.ReactElement;
  requireAdmin?: boolean;
}) => {
  const { token, role } = useUser();

  if (!token) return <Navigate to="/login" />;

  // 관리자 권한 필요 시 checkAccess 활용
  if (!checkAccess(role, requireAdmin ? ["ADMIN"] : undefined)) {
    return <Navigate to="/error/403" />;
  }

  return element;
};

export default ProtectedRoute;
