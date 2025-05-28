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
    const userRow = await dbGet(
      `SELECT department_code, position_code FROM users WHERE id = ?`,
      [userId]
    );
    if (!userRow) {
      logSystemAction(req, req.user, LOG_ACTIONS.ERROR, "사용자 정보 없음");
      return res.status(500).json({ error: "사용자 정보 없음" });
    }
    const { department_code, position_code } = userRow;

    // 현재 직급의 sort_order 조회
    const myLevelRow = await dbGet(
      `SELECT sort_order FROM common_codes WHERE code_group = 'POSITION' AND code = ?`,
      [position_code]
    );
    const mySortOrder = myLevelRow?.sort_order ?? 99;
    // 상위 직급자만 추출 (sort_order < 내 직급)
    const sql = `
      SELECT u.id, u.name, u.position_code, c.label AS position_label
      FROM users u
      JOIN common_codes c
        ON c.code_group = 'POSITION' AND c.code = u.position_code
      WHERE u.status = 'ACTIVE'
        AND u.department_code = ?
        AND u.id != ?
        AND c.sort_order < ?
      ORDER BY c.sort_order ASC
    `;
    const approvers = await dbAll(sql, [department_code, userId, mySortOrder]);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `결재자 자동 지정: ${approvers.length}명`
    );
    res.json({
      approver_ids: approvers.map((a) => a.id),
      approvers, // 상세 리스트도 같이
    });
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
