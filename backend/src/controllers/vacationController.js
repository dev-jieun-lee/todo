//	휴가 신청, 조회, 취소 등 사용자 요청 처리	신청자 (일반 사용자)
const db = require("../config/db");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const { findOverlappingVacation } = require("../models/vacationModel");

// 1. 내 휴가 목록 조회
exports.getMyVacations = (req, res) => {
  const userId = req.user.id;
  const sql = `SELECT * FROM vacations WHERE user_id = ? ORDER BY created_at DESC`;
  db.all(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: "내 휴가 조회 실패" });

    console.log("📤 [getMyVacations] 사용자:", userId, "조회 결과:", rows);
    res.json(rows);
  });

  // 2. 휴가 신청 (approval 승인자 자동 등록은 여기 포함 가능)
  // controllers/vacationController.js
};
exports.applyVacation = (req, res) => {
  const user = req.user;
  const {
    type_code,
    start_date,
    end_date,
    start_time,
    end_time,
    duration_unit,
    reason,
    approver_id,
  } = req.body;

  findOverlappingVacation(
    user.id,
    start_date,
    end_date,
    start_time,
    end_time,
    duration_unit,
    (err, existing) => {
      if (err) return res.status(500).json({ error: "중복 검사 실패" });
      if (existing)
        return res.status(400).json({ error: "중복 신청된 휴가 있음" });

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
          duration_unit,
          reason || null,
        ],
        function (err2) {
          if (err2) return res.status(500).json({ error: "휴가 신청 실패" });

          const vacationId = this.lastID;
          const insertHistorySql = `
          INSERT INTO vacation_history (
            vacation_id, user_id, action, memo, created_at
          ) VALUES (?, ?, ?, ?, datetime('now'))
        `;
          db.run(
            insertHistorySql,
            [vacationId, user.id, "REQUESTED", reason || null],
            (err3) => {
              if (err3) {
                console.error("휴가 이력 기록 실패:", err3);
                logSystemAction(
                  req,
                  req.user,
                  LOG_ACTIONS.ERROR,
                  "휴가 이력 저장 실패"
                );
                // 실패해도 신청 자체는 계속 진행
              }
            }
          );
          //approver_id가 전달된 경우 approval 테이블에도 등록
          if (approver_id) {
            const approvalSql = `
              INSERT INTO approvals (
                target_type, target_id, requester_id, approver_id, step, status
              ) VALUES (?, ?, ?, ?, ?, 'PENDING')
            `;
            db.run(
              approvalSql,
              ["VACATION", vacationId, user.id, approver_id, 1],
              (err3) => {
                if (err3) {
                  console.error("approvals 등록 실패:", err3);
                  return res
                    .status(500)
                    .json({ error: "결재자 등록 실패 (approvals)" });
                }

                const responsePayload = { success: true, vacationId };
                console.log(
                  "📤 [applyVacation] 신청 + 결재 등록 응답:",
                  responsePayload
                );
                logSystemAction(
                  req,
                  user,
                  LOG_ACTIONS.VACATION_REQUEST,
                  `휴가 신청 + 결재 등록: ${vacationId}`
                );
                res.json(responsePayload);
              }
            );
          } else {
            const responsePayload = {
              success: true,
              vacationId,
              warning: "결재자가 지정되지 않았습니다.",
            };
            console.log(
              "📤 [applyVacation] 신청 응답 (결재자 없음):",
              responsePayload
            );
            res.json(responsePayload);
          }
        }
      );
    }
  );
};

// 3. 휴가 취소
exports.cancelVacation = (req, res) => {
  const userId = req.user.id;
  const vacationId = req.params.id;
  const sql = `UPDATE vacations SET status = 'CANCELLED' WHERE id = ? AND user_id = ? AND status = 'PENDING'`;
  db.run(sql, [vacationId, userId], function (err) {
    if (err) return res.status(500).json({ error: "취소 실패" });
    if (this.changes === 0)
      return res.status(400).json({ error: "취소 불가 상태" });

    console.log("📤 [cancelVacation] 취소 성공 ID:", vacationId);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.VACATION_CANCEL,
      `휴가 취소: ${vacationId}`
    );
    res.json({ success: true });
  });
};
