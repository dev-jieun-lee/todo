-- DEPARTMENT with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('DEPARTMENT', 'DESC', '부서 코드: 회사 조직의 소속 부서를 정의', 0, 0),
('DEPARTMENT', 'SALES1', '영업1부', 1, 1),
('DEPARTMENT', 'SALES2', '영업2부', 2, 1),
('DEPARTMENT', 'PLAN', '경영기획팀', 3, 1),
('DEPARTMENT', 'FIN', '자금팀', 4, 1),
('DEPARTMENT', 'SW', 'S/W팀', 5, 1),
('DEPARTMENT', 'SYS', '시스템팀', 6, 1),
('DEPARTMENT', 'CS', '콜센터팀', 7, 1),
('DEPARTMENT', 'OPS', '운영지원팀', 8, 1),
('DEPARTMENT', 'TRAD', '한국전통대중음식연구소', 9, 1),
('DEPARTMENT', 'MEDIA', '영상사업TFT', 10, 1),
('DEPARTMENT', 'HW1', 'H/W 1팀', 11, 1),
('DEPARTMENT', 'HW2', 'H/W 2팀', 12, 1),
('DEPARTMENT', 'ETC', '기타', 13, 1);

-- POSITION with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('POSITION', 'DESC', '직급 코드: 직원의 직급을 정의', 0, 0),
('POSITION', 'CEO', '대표이사', 1, 1),
('POSITION', 'EVP', '상무', 2, 1),
('POSITION', 'DIR', '부장', 3, 1),
('POSITION', 'LEAD', '팀장', 4, 1),
('POSITION', 'DEPHEAD', '파트장', 5, 1),
('POSITION', 'CM', '차장', 6, 1),
('POSITION', 'SNR', '수석', 7, 1),
('POSITION', 'MGR', '과장', 8, 1),
('POSITION', 'ASST', '대리', 9, 1),
('POSITION', 'STAFF', '사원', 10, 1),
('POSITION', 'RESEARCHER', '연구원', 11, 1),
('POSITION', 'CONTRACT', '계약직', 12, 1),
('POSITION', 'INTERN', '인턴', 13, 1),
('POSITION', 'CONSULT', '컨설턴트', 14, 1),
('POSITION', 'ADVISOR', '전문위원', 15, 1),
('POSITION', 'ANALYST', '데이터 분석가', 16, 1),
('POSITION', 'SEC', '보안 담당자', 17, 1),
('POSITION', 'ETC', '기타', 18, 1);

-- EMPLOYMENT_STATUS with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('EMPLOYMENT_STATUS', 'DESC', '재직 상태 코드: 사용자 고용 상태를 정의', 0, 0),
('EMPLOYMENT_STATUS', 'ACTIVE', '재직', 1, 1),
('EMPLOYMENT_STATUS', 'RETIRED', '퇴사', 2, 1),
('EMPLOYMENT_STATUS', 'LEAVE', '휴직', 3, 1),
('EMPLOYMENT_STATUS', 'TERMINATED', '해고', 4, 1),
('EMPLOYMENT_STATUS', 'EXPIRED', '계약 만료', 5, 1),
('EMPLOYMENT_STATUS', 'RETIRED_AGE', '정년 퇴직', 6, 1),
('EMPLOYMENT_STATUS', 'EDU', '교육', 7, 1),
('EMPLOYMENT_STATUS', 'DISPATCHED', '파견', 8, 1),
('EMPLOYMENT_STATUS', 'PARENTING', '육아휴직', 9, 1),
('EMPLOYMENT_STATUS', 'SABBATICAL', '안식휴가', 10, 1),
('EMPLOYMENT_STATUS', 'UNPAID', '무급휴직', 11, 1);

-- ROLE with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('ROLE', 'DESC', '권한 코드: 사용자 시스템 접근 권한을 정의', 0, 0),
('ROLE', 'USER', '일반 사용자', 1, 1),
('ROLE', 'ADMIN', '시스템 관리자', 2, 1),
('ROLE', 'HR', '인사 관리자', 3, 1);

-- BOARD_TYPE with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('BOARD_TYPE', 'DESC', '게시판 유형: 게시판의 용도를 구분', 0, 0),
('BOARD_TYPE', 'NOTICE', '공지사항', 1, 1),
('BOARD_TYPE', 'FREE', '자유게시판', 2, 1),
('BOARD_TYPE', 'QNA', 'Q&A', 3, 1),
('BOARD_TYPE', 'SHARE', '문서 공유', 4, 1);

-- VACATION_TYPE with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('VACATION_TYPE', 'DESC', '휴가 유형 코드: 휴가의 종류를 정의', 0, 0),
('VACATION_TYPE', 'ANNUAL', '연차', 1, 1),
('VACATION_TYPE', 'HALF', '반차', 2, 1),
('VACATION_TYPE', 'SICK', '병가', 3, 1),
('VACATION_TYPE', 'PARENTING', '육아휴직', 4, 1),
('VACATION_TYPE', 'SABBATICAL', '안식휴가', 5, 1),
('VACATION_TYPE', 'UNPAID', '무급휴직', 6, 1),
('VACATION_TYPE', 'ETC', '기타', 7, 1);

-- NOTICE_TARGET with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('NOTICE_TARGET', 'DESC', '공지 대상 코드: 공지사항 수신 대상 설정', 0, 0),
('NOTICE_TARGET', 'ALL', '전체 사용자', 1, 1),
('NOTICE_TARGET', 'TEAM', '해당 팀만', 2, 1),
('NOTICE_TARGET', 'ADMIN', '관리자 전용', 3, 1);

-- CALENDAR_TYPE with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('CALENDAR_TYPE', 'DESC', '일정 분류 코드: 캘린더 일정의 종류 구분', 0, 0),
('CALENDAR_TYPE', 'MEETING', '회의', 1, 1),
('CALENDAR_TYPE', 'DEPLOY', '배포 일정', 2, 1),
('CALENDAR_TYPE', 'VACATION', '휴가', 3, 1),
('CALENDAR_TYPE', 'EDU', '교육', 4, 1),
('CALENDAR_TYPE', 'OUTSIDE', '외근', 5, 1),
('CALENDAR_TYPE', 'DEADLINE', '마감일', 6, 1);

-- LOG_ACTION with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('LOG_ACTION', 'DESC', '로그 액션 코드: 시스템 사용 기록 동작 정의', 0, 0),
('LOG_ACTION', 'LOGIN', '로그인', 1, 1),
('LOG_ACTION', 'LOGOUT', '로그아웃', 2, 1),
('LOG_ACTION', 'CREATE_KPI', 'KPI 생성', 3, 1),
('LOG_ACTION', 'EDIT_TODO', '할 일 수정', 4, 1),
('LOG_ACTION', 'UPLOAD_FILE', '파일 업로드', 5, 1),
('LOG_ACTION', 'DELETE_POST', '게시물 삭제', 6, 1);

-- TODO_STATUS with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('TODO_STATUS', 'DESC', '실행계획 상태 코드: 할 일 상태를 정의', 0, 0),
('TODO_STATUS', 'PENDING', '예정', 1, 1),
('TODO_STATUS', 'DONE', '완료', 2, 1),
('TODO_STATUS', 'CANCELLED', '중단', 3, 1);

-- KPI_CATEGORY with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('KPI_CATEGORY', 'DESC', 'KPI 카테고리 코드: 성과 지표의 분류', 0, 0),
('KPI_CATEGORY', 'SALES', '매출', 1, 1),
('KPI_CATEGORY', 'EFFICIENCY', '업무 효율', 2, 1),
('KPI_CATEGORY', 'QUALITY', '품질 향상', 3, 1),
('KPI_CATEGORY', 'INNOVATION', '혁신', 4, 1),
('KPI_CATEGORY', 'CUSTOMER', '고객 만족도', 5, 1);

-- CALENDAR_TAG with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('CALENDAR_TAG', 'DESC', '캘린더 태그 코드: UI 표시용 일정 태그 정의', 0, 0),
('CALENDAR_TAG', 'MEETING', '회의', 1, 1),
('CALENDAR_TAG', 'DEPLOY', '배포 일정', 2, 1),
('CALENDAR_TAG', 'VACATION', '휴가', 3, 1),
('CALENDAR_TAG', 'EDU', '교육', 4, 1),
('CALENDAR_TAG', 'OUTSIDE', '외근', 5, 1),
('CALENDAR_TAG', 'DEADLINE', '마감일', 6, 1);

-- FILE_TYPE with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('FILE_TYPE', 'DESC', '첨부파일 유형 코드: 업로드 파일의 종류를 정의', 0, 0),
('FILE_TYPE', 'DOC', '문서', 1, 1),
('FILE_TYPE', 'IMG', '이미지', 2, 1),
('FILE_TYPE', 'PDF', 'PDF 문서', 3, 1),
('FILE_TYPE', 'ZIP', '압축 파일', 4, 1),
('FILE_TYPE', 'ETC', '기타', 5, 1);

-- RESET_REASON with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('RESET_REASON', 'DESC', '초기화 사유 코드: 설정 초기화 원인 분류', 0, 0),
('RESET_REASON', 'RECOVERY', '시스템 복구', 1, 1),
('RESET_REASON', 'EMERGENCY', '긴급 초기화', 2, 1),
('RESET_REASON', 'MANUAL', '관리자 수동 요청', 3, 1),
('RESET_REASON', 'SCHEDULED', '정기 초기화', 4, 1);

-- SUGGESTION_TYPE with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('SUGGESTION_TYPE', 'DESC', '제안 유형 코드: 익명 제안 분류', 0, 0),
('SUGGESTION_TYPE', 'WELFARE', '복지 관련', 1, 1),
('SUGGESTION_TYPE', 'SYSTEM', '제도 개선', 2, 1),
('SUGGESTION_TYPE', 'ENV', '근무 환경', 3, 1),
('SUGGESTION_TYPE', 'ETC', '기타', 4, 1);

-- EDU_CATEGORY with DESC
INSERT INTO common_codes (code_group, code, label, sort_order, active) VALUES
('EDU_CATEGORY', 'DESC', '교육 카테고리 코드: 교육 일정 분류', 0, 0),
('EDU_CATEGORY', 'SECURITY', '보안 교육', 1, 1),
('EDU_CATEGORY', 'ONBOARDING', '신입사원 교육', 2, 1),
('EDU_CATEGORY', 'LEADERSHIP', '리더십 교육', 3, 1),
('EDU_CATEGORY', 'IT', 'IT 기술 교육', 4, 1),
('EDU_CATEGORY', 'ETC', '기타', 5, 1);
