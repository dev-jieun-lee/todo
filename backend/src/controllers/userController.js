const { dbGet, dbAll } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

exports.getApprovers = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    logSystemAction(req, req.user, LOG_ACTIONS.ERROR, "사용자 ID 없음");
    return res.status(400).json({ error: "사용자 정보가 없습니다." });
  }

  try {
    // 1. 현재 사용자 부서 코드 조회
    const deptRow = await dbGet(
      "SELECT department_code FROM users WHERE id = ?",
      [userId]
    );
    if (!deptRow) {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.ERROR,
        "사용자 부서 조회 실패"
      );
      return res.status(500).json({ error: "사용자 부서 조회 실패" });
    }

    const userDept = deptRow.department_code;

    // 2. 같은 부서 소속 결재자 목록 조회 + 직급명 포함
    const sql = `
      SELECT u.id, u.name, u.position_code, c.label AS position_label
      FROM users u
      LEFT JOIN common_codes c
        ON c.code_group = 'POSITION'
        AND c.code = u.position_code
      WHERE u.status = 'ACTIVE'
        AND u.department_code = ?
        AND u.id != ?
      ORDER BY u.position_code
    `;

    const approvers = await dbAll(sql, [userDept, userId]);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `결재자 목록 조회: 부서 ${userDept}`
    );
    res.json(approvers);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.ERROR,
      `결재자 조회 실패: ${err.message}`
    );
    return res.status(500).json({ error: "결재자 조회 실패" });
  }
};
