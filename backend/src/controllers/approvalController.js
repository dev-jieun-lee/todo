// controllers/approvalController.js
// 승인/반려 처리, 승인 이력, 대기 목록 등 전자결재 처리
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");

// 1. 승인 처리
exports.approve = async (req, res) => {
  const { targetType, targetId } = req.params;
  const userId = req.user.id;

  console.log("🟢 승인 요청 시작:", { userId, targetType, targetId });

  try {
    const row = await dbGet(
      `SELECT id, status, is_final, step
       FROM approvals
       WHERE LOWER(target_type) = LOWER(?) AND target_id = ? AND approver_id = ?`,
      [targetType, targetId, userId]
    );

    if (!row) {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.APPROVE_FAIL,
        `승인 권한 없음`
      );
      return res.status(403).json({ error: "승인 권한 없음" });
    }

    if (row.status !== "PENDING") {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.APPROVE_FAIL,
        `이미 처리됨 (${row.status})`
      );
      return res.status(400).json({ error: `이미 처리됨 (${row.status})` });
    }

    const currentStep = row.step;
    const approvalId = row.id;

    const minPendingStepRow = await dbGet(
      `SELECT MIN(step) as minStep FROM approvals
       WHERE target_type = ? AND target_id = ? AND status = 'PENDING'`,
      [targetType, targetId]
    );

    if (currentStep > minPendingStepRow.minStep) {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.APPROVE_FAIL,
        `이전 단계 결재 미완료 (현재 step=${currentStep}, 최소 step=${minPendingStepRow.minStep})`
      );
      return res
        .status(400)
        .json({ error: "이전 단계 결재가 완료되지 않았습니다." });
    }

    await dbRun(
      `UPDATE approvals SET status = 'APPROVED', approved_at = datetime('now') WHERE id = ?`,
      [approvalId]
    );
    console.log("✅ approvals 상태 업데이트 완료:", approvalId);

    await dbRun(
      `INSERT INTO approval_history
       (approval_id, target_type, target_id, step, action, memo, actor_id, prev_status, new_status)
       VALUES (?, ?, ?, ?, 'APPROVE', '', ?, 'PENDING', 'APPROVED')`,
      [approvalId, targetType, targetId, currentStep, userId]
    );

    if (row.is_final === 1 && targetType.toLowerCase() === "vacation") {
      const vacationRow = await dbGet(
        `SELECT status, user_id FROM vacations WHERE id = ?`,
        [targetId]
      );

      if (vacationRow) {
        await dbRun(
          `UPDATE vacations
           SET status = 'APPROVED', approved_by = ?, approved_at = datetime('now')
           WHERE id = ?`,
          [userId, targetId]
        );

        await dbRun(
          `INSERT INTO vacation_history
           (vacation_id, user_id, action, old_value, new_value, memo, admin_id)
           VALUES (?, ?, 'APPROVE', ?, 'APPROVED', '최종 승인', ?)`,
          [targetId, vacationRow.user_id, vacationRow.status, userId]
        );

        console.log("✅ 최종 승인 → vacations 업데이트 완료");
      } else {
        console.warn("❗ vacation 레코드 없음");
        logSystemAction(
          req,
          req.user,
          LOG_ACTIONS.APPROVE_FAIL,
          "휴가 정보 없음"
        );
      }
    } else {
      console.log("ℹ️ 최종 승인 아님 → vacation 상태 변경 생략");
    }

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.APPROVE,
      `${targetType} ${targetId} 승인`
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ 승인 처리 중 오류:", err);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.APPROVE_FAIL,
      `승인 처리 중 예외 발생: ${err.message}`
    );
    res.status(500).json({ error: "승인 실패" });
  }
};

// 2. 반려 처리
exports.reject = async (req, res) => {
  const { targetType, targetId } = req.params;
  const userId = req.user.id;
  const { memo = "반려 처리" } = req.body;

  try {
    const row = await dbGet(
      `SELECT status FROM approvals WHERE target_type = ? AND target_id = ? AND approver_id = ?`,
      [targetType, targetId, userId]
    );

    if (!row) {
      logSystemAction(req, req.user, LOG_ACTIONS.REJECT_FAIL, "반려 권한 없음");
      return res.status(403).json({ error: "반려 권한 없음" });
    }

    if (row.status !== "PENDING") {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.REJECT_FAIL,
        `이미 처리됨 (${row.status})`
      );
      return res.status(400).json({ error: `이미 처리됨 (${row.status})` });
    }

    await dbRun(
      `UPDATE approvals SET status = 'REJECTED', memo = ?, approved_at = datetime('now')
       WHERE target_type = ? AND target_id = ? AND approver_id = ?`,
      [memo, targetType, targetId, userId]
    );

    let updateTargetSql = null;
    if (targetType === "vacation")
      updateTargetSql = `UPDATE vacations SET status = 'REJECTED' WHERE id = ?`;
    if (targetType === "kpi")
      updateTargetSql = `UPDATE kpis SET status = 'REJECTED' WHERE id = ?`;
    if (updateTargetSql) await dbRun(updateTargetSql, [targetId]);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.REJECT,
      `${targetType} ${targetId} 반려`
    );

    console.log("📤 [reject] 반려 완료 응답:", {
      targetType,
      targetId,
      userId,
      memo,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ 반려 처리 중 오류:", err);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.REJECT_FAIL,
      `반려 처리 중 예외 발생: ${err.message}`
    );
    res.status(500).json({ error: "반려 실패" });
  }
};
