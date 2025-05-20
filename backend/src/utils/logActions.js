// src/utils/logActions.js

const LOG_ACTIONS = {
  // 🔐 인증 관련
  LOGIN: "LOGIN",
  LOGIN_FAIL: "LOGIN_FAIL",
  LOGOUT: "LOGOUT",
  TOKEN_REFRESH: "TOKEN_REFRESH",
  ACCESS_DENIED: "ACCESS_DENIED",

  // ✅ TODO 기능
  TODO_CREATE: "TODO_CREATE",
  TODO_UPDATE: "TODO_UPDATE",
  TODO_DELETE: "TODO_DELETE",
  HISTORY_VIEW: "HISTORY_VIEW",

  // 👥 사용자 관리
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",

  // 🛠️ 관리자 설정
  SYSTEM_RESET: "SYSTEM_RESET",
  SYSTEM_BACKUP: "SYSTEM_BACKUP",
  ROLE_UPDATE: "ROLE_UPDATE",
  FORCE_LOGOUT: "FORCE_LOGOUT",

  // 📊 KPI
  KPI_SUBMIT: "KPI_SUBMIT",
  KPI_UPDATE: "KPI_UPDATE",
  KPI_REVIEW: "KPI_REVIEW",
};

const LOG_ACTION_LABELS = {
  // 🔐 인증 관련
  LOGIN: "로그인 성공",
  LOGIN_FAIL: "로그인 실패",
  LOGOUT: "로그아웃",
  TOKEN_REFRESH: "토큰 갱신",
  ACCESS_DENIED: "접근 거부",

  // ✅ TODO 기능
  TODO_CREATE: "할 일 생성",
  TODO_UPDATE: "할 일 수정",
  TODO_DELETE: "할 일 삭제",
  HISTORY_VIEW: "TODO 히스토리 조회",

  // 👥 사용자 관리
  USER_CREATE: "사용자 등록",
  USER_UPDATE: "사용자 정보 수정",
  USER_DELETE: "사용자 삭제",

  // 🛠️ 관리자 설정
  SYSTEM_RESET: "시스템 초기화",
  SYSTEM_BACKUP: "시스템 백업",
  ROLE_UPDATE: "역할 권한 변경",
  FORCE_LOGOUT: "사용자 강제 로그아웃",

  // 📊 KPI
  KPI_SUBMIT: "KPI 제출",
  KPI_UPDATE: "KPI 수정",
  KPI_REVIEW: "KPI 검토",
};

module.exports = { LOG_ACTIONS, LOG_ACTION_LABELS };
