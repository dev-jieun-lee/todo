//	휴가 신청, 조회, 취소 등 사용자 요청 처리	신청자 (일반 사용자)
const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const { findOverlappingVacation } = require("../models/vacationModel");

// 1. 내 휴가 목록 조회
exports.getMyVacations = async (req, res) => {
  const userId = req.user.id;
  try {
    const rows = await dbAll(
      "SELECT * FROM vacations WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `내 휴가 목록 조회: ${rows.length}건`
    );
    res.json(rows);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.ERROR,
      `내 휴가 목록 조회 실패: ${err.message}`
    );
    res.status(500).json({ error: "내 휴가 조회 실패" });
  }
};

// 2. 휴가 신청
exports.applyVacation = async (req, res) => {
  const user = req.user;
  const {
    type_code,
    start_date,
    end_date,
    start_time,
    end_time,
    duration_unit,
    reason,
    approver_ids = [],
  } = req.body;

  try {
    const userRow = await dbGet(
      `SELECT name, department_code, position_code FROM users WHERE id = ?`,
      [user.id]
    );

    if (!userRow) {
      logSystemAction(req, user, LOG_ACTIONS.ERROR, "신청자 정보 없음");
      return res.status(500).json({ error: "신청자 정보 없음" });
    }

    const { name, department_code, position_code } = userRow;

    const overlapping = await findOverlappingVacation(
      user.id,
      start_date,
      end_date,
      start_time,
      end_time,
      duration_unit
    );
    if (overlapping) {
      logSystemAction(req, user, LOG_ACTIONS.ERROR, "중복 신청된 휴가 있음");
      return res.status(400).json({ error: "중복 신청된 휴가 있음" });
    }

    const insertSql = `
      INSERT INTO vacations (
        user_id, type_code, start_date, end_date,
        start_time, end_time, duration_unit, reason, status,
        snapshot_name, snapshot_department_code, snapshot_position_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
    `;
    const insertParams = [
      user.id,
      type_code,
      start_date,
      end_date,
      start_time || null,
      end_time || null,
      duration_unit,
      reason || null,
      name,
      department_code,
      position_code,
    ];

    const vacationId = await dbRun(insertSql, insertParams);

    await dbRun(
      `INSERT INTO vacation_history (vacation_id, user_id, action, memo, created_at) VALUES (?, ?, 'REQUESTED', ?, datetime('now'))`,
      [vacationId, user.id, reason || null]
    );

    for (let i = 0; i < approver_ids.length; i++) {
      const isFinal = i === approver_ids.length - 1 ? 1 : 0;
      const step = i + 1;

      await dbRun(
        `INSERT INTO approvals (target_type, target_id, requester_id, approver_id, step, status, is_final)
         VALUES ('VACATION', ?, ?, ?, ?, 'PENDING', ?)`,
        [vacationId, user.id, approver_ids[i], step, isFinal]
      );
    }

    logSystemAction(
      req,
      user,
      LOG_ACTIONS.CREATE_VACATION,
      `휴가 신청 완료: ID=${vacationId}`
    );
    res.json({ success: true, vacationId });
  } catch (err) {
    logSystemAction(
      req,
      user,
      LOG_ACTIONS.ERROR,
      `휴가 신청 실패: ${err.message}`
    );
    res.status(500).json({ error: "휴가 신청 실패" });
  }
};

// 3. 휴가 취소
exports.cancelVacation = async (req, res) => {
  const userId = req.user.id;
  const vacationId = req.params.id;

  try {
    const result = await dbRun(
      `UPDATE vacations SET status = 'CANCELLED' WHERE id = ? AND user_id = ? AND status = 'PENDING'`,
      [vacationId, userId]
    );

    if (result.changes === 0) {
      return res.status(400).json({ error: "취소 불가 상태" });
    }

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.VACATION_CANCEL,
      `휴가 취소: ${vacationId}`
    );
    res.json({ success: true });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.ERROR,
      `휴가 취소 실패: ${err.message}`
    );
    res.status(500).json({ error: "취소 실패" });
  }
};
