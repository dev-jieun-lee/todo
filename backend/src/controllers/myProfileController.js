const db = require("../config/db");
const {
  handleDbError,
  logEvent,
  logWarning,
  logError,
  logSystemAction,
} = require("../utils/handleError");

exports.getMyProfile = (req, res) => {
  const userId = req.user.id;
  const userInfo = {
    id: req.user.id,
    username: req.user.username,
  };

  const query = `
  SELECT
    u.username,
    u.name,
    u.email,
    u.role,
    u.employee_number,
    u.hire_date,
    u.leave_date,
    u.status,
    d.label AS department,
    p.label AS position,
    t.label AS team,
    s.label AS status_label,
    login_log.last_login
  FROM users u
  LEFT JOIN common_codes d ON u.department_code = d.code AND d.code_group = 'DEPARTMENT'
  LEFT JOIN common_codes p ON u.position_code = p.code AND p.code_group = 'POSITION'
  LEFT JOIN common_codes t ON u.team_code = t.code AND t.code_group = 'TEAM'
  LEFT JOIN common_codes s ON u.status = s.code AND s.code_group = 'EMPLOYMENT_STATUS'
  LEFT JOIN (
    SELECT user_id, MAX(created_at) AS last_login
    FROM system_logs
    WHERE action = 'LOGIN'
    GROUP BY user_id
  ) login_log ON u.id = login_log.user_id
  WHERE u.id = ?
`;

  db.get(query, [userId], (err, row) => {
    if (err) {
      return handleDbError(res, "내 정보 조회", err);
    }

    if (!row) {
      logWarning(`내 정보 조회 실패: 사용자(${userId}) 정보 없음`);
      return res.status(404).json({ error: "사용자 정보를 찾을 수 없습니다." });
    }

    logEvent(`사용자(${row.username}) 내 정보 조회`);
    logSystemAction(req, userInfo, "PROFILE_VIEW", "내 정보 조회 수행");

    res.json(row);
  });
};

exports.getLeaveSummary = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      (SELECT COUNT(*) FROM vacations WHERE user_id = ? AND status = '승인') AS usedCount,
      '2025-12-31' AS expireDate,  -- 예시값
      15 - (SELECT COUNT(*) FROM vacations WHERE user_id = ? AND status = '승인') AS remaining
  `;

  db.get(sql, [userId, userId], (err, row) => {
    if (err) return res.status(500).json({ error: "요약 조회 실패" });
    res.json({
      remaining: row.remaining,
      usedThisMonth: row.usedCount, // 여기선 단순 total 사용, 월별은 추후 추가
      expireDate: row.expireDate,
    });
  });
};
