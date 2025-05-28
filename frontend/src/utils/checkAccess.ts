import type { RoleType } from "../contexts/types";

export const checkAccess = (
  userRole: RoleType,
  requiredRoles?: RoleType[]
): boolean => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return requiredRoles.includes(userRole);
};
export const checkAccessByScope = (
  userRole: RoleType,
  scopeCode?: string
): boolean => {
  const map: Record<string, RoleType[]> = {
    ALL: ["ADMIN", "USER", "HR"],
    ADMIN_ONLY: ["ADMIN"],
    HR_ONLY: ["HR"],
    CEO_ONLY: ["ADMIN"], // 대표는 ADMIN 권한으로 판단 시
  };

  if (!scopeCode || scopeCode === "ALL") return true;
  return map[scopeCode]?.includes(userRole) ?? false;
};
