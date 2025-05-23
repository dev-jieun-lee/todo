const db = require("../config/db");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const { findOverlappingVacation } = require("../models/vacationModel");

// 1. 내 휴가 목록 조회
exports.getMyVacations = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      id, type_code, start_date, end_date,
      start_time, end_time, duration_unit,
      status, reason, created_at
    FROM vacations
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) return handleDbError(res, "내 휴가 목록 조회", err);
    res.json(rows);
  });
};

// 2. 휴가 신청
exports.applyVacation = (req, res) => {
  try {
    const {
      type_code,
      start_date,
      end_date,
      start_time,
      end_time,
      duration_unit,
      reason,
    } = req.body;
    const user = req.user;
    // 로그 찍기
    console.log("[휴가 신청] 시간값 체크:", {
      start_date,
      end_date,
      start_time,
      end_time,
      duration_unit,
    });

    // 중복 체크는 try 블록 안에서!
    findOverlappingVacation(
      user.id,
      start_date,
      end_date,
      start_time,
      end_time,
      duration_unit,
      (err, row) => {
        if (err) return res.status(500).json({ error: "중복 검사 실패" });
        if (row) {
          return res
            .status(400)
            .json({ error: "해당 기간에 이미 신청된 휴가가 존재합니다." });
        }

        const sql = `
      INSERT INTO vacations (
        user_id, type_code, start_date, end_date,
        start_time, end_time, duration_unit, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `;

        db.run(
          sql,
          [
            user.id,
            type_code,
            start_date,
            end_date,
            start_time || null,
            end_time || null,
            duration_unit || "FULL",
            reason || null,
          ],
          function (err) {
            if (err) return handleDbError(res, "휴가 신청 INSERT", err);

            const newValue = JSON.stringify({
              type_code,
              start_date,
              end_date,
              start_time,
              end_time,
              duration_unit,
              status: "PENDING",
            });

            const historySql = `
          INSERT INTO vacation_history (
            vacation_id, user_id, action, new_value, admin_id
          ) VALUES (?, ?, 'PENDING', ?, ?)
        `;
            db.run(
              historySql,
              [this.lastID, user.id, newValue, user.id],
              (err2) => {
                if (err2) {
                  logError("휴가 히스토리 INSERT", err2);
                }
              }
            );

            logSystemAction(
              req,
              user,
              LOG_ACTIONS.VACATION_REQUEST,
              `${type_code} 휴가 신청`
            );

            res.json({ success: true });
          }
        );
      }
    );
  } catch (err) {
    logError("휴가 신청 처리 중 예외", err);
    res.status(500).json({ error: "휴가 신청 예외 발생" });
  }
};

// 3. 휴가 취소
exports.cancelVacation = (req, res) => {
  try {
    const user = req.user;
    const vacationId = req.params.id;

    const oldSql = `SELECT * FROM vacations WHERE id = ? AND user_id = ?`;
    db.get(oldSql, [vacationId, user.id], (err, oldRow) => {
      if (err) return handleDbError(res, "휴가 취소 - 기존 조회", err);
      if (!oldRow)
        return res.status(404).json({ error: "기존 휴가 정보 없음" });

      const updateSql = `
        UPDATE vacations SET status = 'CANCELLED'
        WHERE id = ? AND user_id = ? AND status = 'PENDING'
      `;

      db.run(updateSql, [vacationId, user.id], function (err2) {
        if (err2) return handleDbError(res, "휴가 취소 UPDATE", err2);
        if (this.changes === 0)
          return res.status(400).json({ error: "이미 처리된 휴가입니다." });

        const oldValue = JSON.stringify({ status: oldRow.status });
        const newValue = JSON.stringify({ status: "CANCELLED" });

        const insertHistory = `
          INSERT INTO vacation_history (
            vacation_id, user_id, action, old_value, new_value, memo, admin_id
          ) VALUES (?, ?, 'CANCELLED', ?, ?, ?, ?)
        `;
        db.run(
          insertHistory,
          [
            vacationId,
            user.id,
            oldValue,
            newValue,
            "사용자 직접 취소",
            user.id,
          ],
          (err3) => {
            if (err3) {
              logError("휴가 히스토리 취소 INSERT", err3);
            }
          }
        );

        logSystemAction(
          req,
          user,
          LOG_ACTIONS.VACATION_CANCEL,
          `휴가 신청 취소: ID ${vacationId}`
        );

        res.json({ success: true });
      });
    });
  } catch (err) {
    logError("휴가 취소 처리 중 예외", err);
    res.status(500).json({ error: "휴가 취소 예외 발생" });
  }
};

//4.승인 및 반려 처리
// 승인 처리
exports.approveVacation = (req, res) => {
  const vacationId = req.params.id;
  const adminId = req.user.id;

  const getSql = `SELECT * FROM vacations WHERE id = ? AND status = 'PENDING'`;
  db.get(getSql, [vacationId], (err, oldRow) => {
    if (err) return res.status(500).json({ error: "기존 휴가 조회 실패" });
    if (!oldRow)
      return res.status(404).json({ error: "대기 중인 휴가가 없습니다." });

    const updateSql = `
      UPDATE vacations
      SET status = 'APPROVED',
          approved_by = ?,
          approved_at = datetime('now')
      WHERE id = ?
    `;
    db.run(updateSql, [adminId, vacationId], function (err2) {
      if (err2) return res.status(500).json({ error: "승인 처리 실패" });

      const oldValue = JSON.stringify({ status: oldRow.status });
      const newValue = JSON.stringify({ status: "APPROVED" });

      const historySql = `
        INSERT INTO vacation_history (
          vacation_id, user_id, action, old_value, new_value, memo, admin_id
        ) VALUES (?, ?, 'APPROVED', ?, ?, '관리자 승인', ?)
      `;
      db.run(
        historySql,
        [vacationId, oldRow.user_id, oldValue, newValue, adminId],
        (err3) => {
          if (err3) console.warn("휴가 승인 히스토리 기록 실패:", err3);
        }
      );

      res.json({ success: true });
    });
  });
};

// 반려 처리
exports.rejectVacation = (req, res) => {
  const vacationId = req.params.id;
  const adminId = req.user.id;
  const { memo = "관리자 반려" } = req.body;

  const getSql = `SELECT * FROM vacations WHERE id = ? AND status = 'PENDING'`;
  db.get(getSql, [vacationId], (err, oldRow) => {
    if (err) return res.status(500).json({ error: "기존 휴가 조회 실패" });
    if (!oldRow)
      return res.status(404).json({ error: "대기 중인 휴가가 없습니다." });

    const updateSql = `
      UPDATE vacations
      SET status = 'REJECTED',
          approved_by = ?,
          approved_at = datetime('now')
      WHERE id = ?
    `;
    db.run(updateSql, [adminId, vacationId], function (err2) {
      if (err2) return res.status(500).json({ error: "반려 처리 실패" });

      const oldValue = JSON.stringify({ status: oldRow.status });
      const newValue = JSON.stringify({ status: "REJECTED" });

      const historySql = `
        INSERT INTO vacation_history (
          vacation_id, user_id, action, old_value, new_value, memo, admin_id
        ) VALUES (?, ?, 'REJECTED', ?, ?, ?, ?)
      `;
      db.run(
        historySql,
        [vacationId, oldRow.user_id, oldValue, newValue, memo, adminId],
        (err3) => {
          if (err3) console.warn("휴가 반려 히스토리 기록 실패:", err3);
        }
      );

      res.json({ success: true });
    });
  });
};

// 전체 휴가 요청 목록 (관리자용)
exports.getAllVacationRequests = (req, res) => {
  const sql = `
    SELECT
      v.*,
      u.username AS user_username,
      u.name AS user_name,
      a.username AS approver_username,
      a.name AS approver_name,
      a.department_code AS approver_dept,
      a.position_code AS approver_position,
      v.reason,
      v.created_at
    FROM vacations v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN users a ON v.approved_by = a.id
    ORDER BY v.created_at DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "휴가 목록 조회 실패" });
    res.json(rows);
  });
};
