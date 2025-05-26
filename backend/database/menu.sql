-- 최상위 메뉴 (roles 지정)
INSERT INTO menus (id, parent_id, label, path, icon, roles, type, sort_order) VALUES
(1, NULL, '대시보드', NULL, 'DashboardIcon', '["ADMIN", "USER", "HR"]', 'group', 1),
(2, NULL, '성과 관리 (KPI)', NULL, 'KpiIcon', '["ADMIN", "USER", "HR"]', 'group', 2),
(3, NULL, '실행 관리', NULL, 'TodoIcon', '["ADMIN", "USER", "HR"]', 'group', 3),
(4, NULL, '업무 게시판', NULL, 'BoardIcon', '["ADMIN", "USER", "HR"]', 'group', 4),
(5, NULL, '공용 캘린더', NULL, 'CalendarIcon', '["ADMIN", "USER", "HR"]', 'group', 5),
(6, NULL, '공지 / 소통', NULL, 'NoticeIcon', '["ADMIN", "USER", "HR"]', 'group', 6),
(7, NULL, '사용자 / 권한 관리 (관리자)', NULL, 'UserIcon', '["ADMIN"]', 'group', 99),
(8, NULL, '시스템 설정 (관리자)', NULL, 'SettingsIcon', '["ADMIN"]', 'group', 100);

-- 대시보드 하위
INSERT INTO menus (parent_id, label, path, sort_order) VALUES
(1, '오늘 할 일 요약', '/dashboard/today', 1),
(1, 'KPI 달성률', '/dashboard/kpi', 2),
(1, '공지사항 / 일정 알림', '/dashboard/notice', 3),
(1, '휴가 중인 인원', '/dashboard/vacation', 4);

-- KPI 하위
INSERT INTO menus (parent_id, label, path, sort_order) VALUES
(2, '내 KPI 기록', '/kpi/my', 1),
(2, '팀별 목표 설정 (OKR)', '/kpi/team', 2),
(2, 'KPI 달성 현황판 (그래프, 리포트)', '/kpi/summary', 3);

-- 실행 관리 하위
INSERT INTO menus (parent_id, label, path, sort_order) VALUES
(3, '나의 실행 계획 (To-do)', '/todo/my', 1),
(3, '팀 단위 체크리스트', '/todo/team', 2),
(3, '상태별 보기 (예정 / 완료 / 중단)', '/todo/status', 3);

-- 게시판 하위
INSERT INTO menus (parent_id, label, path, sort_order) VALUES
(4, '자유 게시판', '/board/free', 1),
(4, '팀별 공유 게시판', '/board/team', 2),
(4, '프로젝트별 회의록 / 자료실', '/board/project', 3);

-- 캘린더 하위
INSERT INTO menus (parent_id, label, path, sort_order) VALUES
(5, '팀 일정 보기 (주간/월간)', '/calendar/team', 1),
(5, '배포 일정 관리', '/calendar/deploy', 2),
(5, '회의 / 외근 / 교육 일정', '/calendar/meeting', 3),
(5, '연차 / 반차 / 병가 신청 및 현황', '/calendar/vacation', 4),
(5, '개인 KPI / TODO 마감일 연동', '/calendar/deadline', 5);

-- 공지 하위
INSERT INTO menus (parent_id, label, path, sort_order) VALUES
(6, '공지사항', '/notice/global', 1),
(6, '팀 공지 (역할별 가시성 설정)', '/notice/team', 2),
(6, '익명 제안함 (선택)', '/notice/suggestion', 3);

-- 관리자 메뉴 하위
INSERT INTO menus (parent_id, label, path, sort_order) VALUES
(7, '사용자 목록 및 초대', '/admin/users', 1),
(7, '역할 및 접근 권한 설정', '/admin/roles', 2),
(7, '휴가 승인 / 계정 잠금', '/admin/vacations', 3),
(7, '사용자 세션 관리', '/admin/sessions', 4);

-- 시스템 설정 하위
INSERT INTO menus (parent_id, label, path, sort_order) VALUES
(8, '업무/KPI 카테고리 설정', '/admin/settings/categories', 1),
(8, '캘린더 색상/태그 설정', '/admin/settings/calendar', 2),
(8, '초기화 및 백업', '/admin/settings/reset', 3),
(8, '로그 기록 / 시스템 상태', '/admin/settings/logs', 4);

CREATE TABLE IF NOT EXISTS menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER,
  label TEXT NOT NULL,
  path TEXT,                 -- 실제 라우트 경로 (없으면 group 헤더로 처리)
  icon TEXT,                 -- DashboardIcon 등
    roles TEXT, -- JSON 문자열 (예: '["ADMIN","USER"]')
  visibility TEXT DEFAULT 'visible', -- visible / hidden / dev-only 등
  type TEXT DEFAULT 'link', -- link / group / divider / external 등
  description TEXT,          -- 마우스 오버 도움말 등
  sort_order INTEGER DEFAULT 0
);

  SELECT * FROM menus ORDER BY parent_id IS NULL DESC, parent_id, sort_order;
  UPDATE menus
SET roles = '["ADMIN", "USER", "HR"]'
WHERE parent_id IS NOT NULL
  AND roles IS NULL;


  -- 상위 메뉴: 결재함 (id = 9)
INSERT INTO menus (
  id, parent_id, label, path, icon, roles, visibility, type, description, sort_order
) VALUES (
  9, NULL, '결재함', NULL, 'InboxIcon',
  '["ADMIN", "USER", "HR"]', 'visible', 'group', '승인 관련 요청 및 결재 보기', 7
);

-- 하위 메뉴: 내가 승인할 항목 (id = 38)
INSERT INTO menus (
  id, parent_id, label, path, icon, roles, visibility, type, description, sort_order
) VALUES (
  38, 9, '내가 승인할 항목', '/approvals/inbox', NULL,
  '["ADMIN", "USER", "HR"]', 'visible', 'link', '내가 결재할 승인 요청 목록', 1
);

-- 하위 메뉴: 내가 요청한 항목 (id = 39)
INSERT INTO menus (
  id, parent_id, label, path, icon, roles, visibility, type, description, sort_order
) VALUES (
  39, 9, '내가 요청한 항목', '/approvals/requested', NULL,
  '["ADMIN", "USER", "HR"]', 'visible', 'link', '내가 신청한 승인 요청 목록', 2
);