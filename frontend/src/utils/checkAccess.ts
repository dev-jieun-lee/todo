import type { RoleType } from "../contexts/types";

/**
 * 사용자 역할 기반 접근 권한 체크
 * @param userRole - 사용자 역할
 * @param requiredRoles - 필요한 역할 배열
 * @returns 접근 권한 여부
 */
export const checkAccess = (
  userRole: RoleType,
  requiredRoles?: RoleType[]
): boolean => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return requiredRoles.includes(userRole);
};

/**
 * 스코프 기반 접근 권한 체크
 * @param userRole - 사용자 역할
 * @param scopeCode - 스코프 코드
 * @returns 접근 권한 여부
 */
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

/**
 * 팀장 이상 권한 체크
 * @param positionCode - 사용자의 직급 코드
 * @returns 팀장 이상 권한 여부
 */
export const hasManagerOrHigherPermission = (positionCode?: string): boolean => {
  if (!positionCode) return false;
  
  const managerPositions = ['LEAD', 'DEPHEAD', 'DIR', 'EVP', 'CEO'];
  return managerPositions.includes(positionCode);
};

/**
 * 직급 코드를 한국어 라벨로 변환
 * @param positionCode - 직급 코드
 * @returns 한국어 직급 라벨
 */
export const getPositionLabel = (positionCode?: string): string => {
  if (!positionCode) return "직급 없음";
  
  const positionLabels: Record<string, string> = {
    'CEO': '대표이사',
    'EVP': '상무',
    'DIR': '부장',
    'LEAD': '팀장',
    'DEPHEAD': '파트장',
    'CM': '차장',
    'SNR': '수석',
    'MGR': '과장',
    'ASST': '대리',
    'STAFF': '사원',
    'RESEARCHER': '연구원',
    'CONTRACT': '계약직',
    'INTERN': '인턴',
    'CONSULT': '컨설턴트',
    'ADVISOR': '전문위원',
    'ANALYST': '데이터 분석가',
    'SEC': '보안 담당자',
    'ETC': '기타',
  };
  
  return positionLabels[positionCode] || positionCode;
};
