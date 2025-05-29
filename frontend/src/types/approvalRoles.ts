// 📁 src/types/approvalRoles.ts
export const roleToPositionMap: Record<string, string> = {
  partLead: "DEPHEAD",
  teamLead: "LEAD",
  deptHead: "DIR",
  ceo: "CEO",
  manager: "MGR", // optional
};

export const positionToRoleMap: Record<string, string> = {
  DEPHEAD: "partLead",
  LEAD: "teamLead",
  DIR: "deptHead",
  EVP: "deptHead", // 상무도 부서장 역할
  CEO: "ceo",
  MGR: "manager",
};

export const roleLabelMap: Record<string, string> = {
  partLead: "파트장",
  teamLead: "팀장",
  deptHead: "부서장",
  ceo: "대표",
  manager: "담당",
};

export const approverRoleOrder: string[] = [
  "partLead",
  "teamLead",
  "deptHead",
  "ceo",
];
