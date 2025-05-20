import type { RoleType } from "../contexts/types";

export const checkAccess = (
  userRole: RoleType,
  requiredRoles?: RoleType[]
): boolean => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return requiredRoles.includes(userRole);
};
