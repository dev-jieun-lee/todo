1. 휴가 신청 시 백엔드 동작
신청자가 휴가를 신청

applyVacation에서 createApprovalLines 호출

createApprovalLines에서

approval_lines 테이블에서

부서/팀/route/직급조건(condition_expression)에 맞는 결재선(line)만 조회

조건에 맞는 line 개수만큼

approvals 테이블에 한 row씩 INSERT

각 row에 SKIP(대각선), PROXY(전결) 등 proxy_type, proxy_role 정보도 함께 저장

is_final: 마지막 step만 1, 나머지는 0



요건
vacation
sales1,
team1
basic결재
-- 1. 팀원이 신청한 경우 (applicant_role IN (...))
INSERT INTO approval_lines
(doc_type, department_code, team_code, step, role_code, user_id, is_required, route_name, proxy_type, proxy_role, note, condition_expression)
VALUES
('VACATION','SALES1','TEAM1',1,'STAFF',NULL,1,'basic','ORIGINAL',NULL,'담당자 본인사인',"applicant_role IN ('STAFF','MGR','ASST','SNR','CM')"),
('VACATION','SALES1','TEAM1',2,'DEPHEAD',NULL,1,'basic','SKIP',NULL,'파트장 없음-대각선',"applicant_role IN ('STAFF','MGR','ASST','SNR','CM')"),
('VACATION','SALES1','TEAM1',3,'LEAD',NULL,1,'basic','ORIGINAL',NULL,'팀장 사인',"applicant_role IN ('STAFF','MGR','ASST','SNR','CM')"),
('VACATION','SALES1','TEAM1',4,'DIR',NULL,1,'basic','PROXY','DIR','부장 전결',"applicant_role IN ('STAFF','MGR','ASST','SNR','CM')"),
('VACATION','SALES1','TEAM1',5,'CEO',NULL,1,'basic','SKIP','DIR','대표는 부장전결',"applicant_role IN ('STAFF','MGR','ASST','SNR','CM')");

-- 2. 팀장이 신청한 경우
INSERT INTO approval_lines
(doc_type, department_code, team_code, step, role_code, user_id, is_required, route_name, proxy_type, proxy_role, note, condition_expression)
VALUES
('VACATION','SALES1','TEAM1',1,'STAFF',NULL,1,'basic','SKIP',NULL,'담당자 대각선처리',"applicant_role='LEAD'"),
('VACATION','SALES1','TEAM1',2,'DEPHEAD',NULL,1,'basic','SKIP',NULL,'파트장 없음-대각선',"applicant_role='LEAD'"),
('VACATION','SALES1','TEAM1',3,'LEAD',NULL,1,'basic','ORIGINAL',NULL,'팀장 본인사인',"applicant_role='LEAD'"),
('VACATION','SALES1','TEAM1',4,'DIR',NULL,1,'basic','PROXY','DIR','부장 전결',"applicant_role='LEAD'"),
('VACATION','SALES1','TEAM1',5,'CEO',NULL,1,'basic','SKIP','DIR','대표는 부장전결',"applicant_role='LEAD'");

-- 3. 부장이 신청한 경우
INSERT INTO approval_lines
(doc_type, department_code, team_code, step, role_code, user_id, is_required, route_name, proxy_type, proxy_role, note, condition_expression)
VALUES
('VACATION','SALES1','TEAM1',1,'STAFF',NULL,1,'basic','SKIP',NULL,'담당자 대각선처리',"applicant_role='DIR'"),
('VACATION','SALES1','TEAM1',2,'DEPHEAD',NULL,1,'basic','SKIP',NULL,'파트장 없음-대각선',"applicant_role='DIR'"),
('VACATION','SALES1','TEAM1',3,'LEAD',NULL,1,'basic','SKIP',NULL,'팀장 대각선처리',"applicant_role='DIR'"),
('VACATION','SALES1','TEAM1',4,'DIR',NULL,1,'basic','PROXY','DIR','부장 본인전결',"applicant_role='DIR'"),
('VACATION','SALES1','TEAM1',5,'CEO',NULL,1,'basic','SKIP','DIR','대표는 부장전결',"applicant_role='DIR'");



INSERT INTO approval_lines
(doc_type, department_code, team_code, step, role_code, is_required, route_name, proxy_type, proxy_role, note, condition_expression)
SELECT doc_type, department_code, 'TEAM2', step, role_code, is_required, route_name, proxy_type, proxy_role, note, condition_expression
FROM approval_lines
WHERE department_code = 'SALES1'
  AND team_code = 'TEAM1'
  AND doc_type = 'VACATION'
  AND route_name = 'basic';


