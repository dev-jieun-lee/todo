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
