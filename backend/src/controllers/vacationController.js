//	휴가 신청, 조회, 취소 등 사용자 요청 처리	신청자 (일반 사용자)
const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const { findOverlappingVacation } = require("../models/vacationModel");

// 1. 내 휴가 목록 조회
// 사용자가 신청한 자신의 휴가 목록을 최신순으로 조회
exports.getMyVacations = async (req, res) => {
  const userId = req.user.id;
  try {
    const rows = await dbAll(
      `SELECT * FROM vacations WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      "내 휴가 목록 조회",
      "info"
    );
    res.json(rows);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      `내 휴가 목록 조회 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "내 휴가 조회 실패" });
  }
};

// 2. 휴가 신청
// 사용자가 휴가를 신청하며, 승인자와 이력도 함께 등록
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
    note,
    approver_ids = [], // 다단계 결재자 리스트
  } = req.body;
  if (!Array.isArray(approver_ids) || approver_ids.length === 0) {
    console.warn("❌ 결재자 목록이 비어 있음. approver_ids:", approver_ids);
    return res.status(400).json({ error: "결재자 목록이 누락되었습니다." });
  }
  try {
    // 사용자 이름, 부서, 직급 스냅샷 조회
    const userSnapshot = await dbGet(
      `SELECT name, department_code, position_code FROM users WHERE id = ?`,
      [user.id]
    );

    if (!userSnapshot) {
      logSystemAction(
        req,
        user,
        LOG_ACTIONS.ERROR,
        "신청자 정보 없음",
        "error"
      );
      return res.status(500).json({ error: "신청자 정보 없음" });
    }

    // 동일 기간 내 중복 신청 여부 검사 (duration_unit 포함)
    const overlapping = await findOverlappingVacation(
      req,
      user.id,
      start_date,
      end_date,
      start_time,
      end_time,
      duration_unit
    );
    if (overlapping) {
      logSystemAction(
        req,
        user,
        LOG_ACTIONS.ERROR,
        "중복 신청된 휴가 있음",
        "error"
      );
      return res.status(400).json({ error: "중복 신청된 휴가 있음" });
    }

    // 휴가 정보 저장 (스냅샷 포함)
    const result = await dbRun(
      `INSERT INTO vacations (
        user_id, type_code, start_date, end_date,
        start_time, end_time, duration_unit, reason, note,
        status, created_at, snapshot_name, snapshot_department_code, snapshot_position_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'), ?, ?, ?)`,
      [
        user.id,
        type_code,
        start_date,
        end_date,
        start_time || null,
        end_time || null,
        duration_unit,
        reason || null,
        note || null,
        userSnapshot.name,
        userSnapshot.department_code,
        userSnapshot.position_code,
      ]
    );

    const vacationId = result.lastID;

    // 신청 이력 기록
    await dbRun(
      `INSERT INTO vacation_history (
        vacation_id, user_id, action, old_value, new_value, memo, admin_id
      ) VALUES (?, ?, 'REQUESTED', '', 'PENDING', ?, ?)`,
      [vacationId, user.id, reason || "휴가 신청", user.id]
    );

    // 결재자(approver) 정보 저장 (다단계 결재 처리)
    for (let i = 0; i < approver_ids.length; i++) {
      const step = i + 1;
      const isFinal = i === approver_ids.length - 1 ? 1 : 0;
      const currentStep = step === 1 ? 1 : null; // ✅ 1차 결재자에게만 current_pending_step 지정

      await dbRun(
        `INSERT INTO approvals (
      target_type, target_id, requester_id, approver_id, step,
      status, is_final, current_pending_step, created_at
    ) VALUES ('VACATION', ?, ?, ?, ?, 'PENDING', ?, ?, datetime('now'))`,
        [vacationId, user.id, approver_ids[i], step, isFinal, currentStep]
      );
    }

    // 시스템 로그 기록 및 응답 반환
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.CREATE,
      `휴가 신청 완료 (ID: ${vacationId})`,
      "info"
    );
    res.json({ success: true, vacationId });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.CREATE_FAIL,
      `휴가 신청 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "휴가 신청 실패" });
  }
};

// 3. 휴가 취소
//// 사용자가 PENDING 상태의 휴가를 취소하고 이력을 남김
exports.cancelVacation = async (req, res) => {
  const vacationId = req.params.id;
  const userId = req.user.id;

  try {
    // 휴가 정보 확인 및 상태 검증
    const vacation = await dbGet(
      `SELECT * FROM vacations WHERE id = ? AND user_id = ?`,
      [vacationId, userId]
    );

    if (!vacation) {
      return res.status(404).json({ error: "휴가 정보를 찾을 수 없습니다." });
    }
    if (vacation.status !== "PENDING") {
      return res
        .status(400)
        .json({ error: "결재 중인 휴가만 취소할 수 있습니다." });
    }

    // 상태 변경
    await dbRun(`UPDATE vacations SET status = 'CANCELLED' WHERE id = ?`, [
      vacationId,
    ]);

    // 중복 이력 방지 후 이력 기록
    const exists = await dbGet(
      `SELECT 1 FROM vacation_history WHERE vacation_id = ? AND action = 'CANCEL'`,
      [vacationId]
    );
    if (!exists) {
      await dbRun(
        `INSERT INTO vacation_history (
          vacation_id, user_id, action, old_value, new_value, memo, admin_id
        ) VALUES (?, ?, 'CANCEL', ?, 'CANCELLED', '사용자 취소', ?)`,
        [vacationId, userId, vacation.status, userId]
      );
    }

    // 시스템 로그 및 응답 처리
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.DELETE,
      `휴가 취소 완료 (ID: ${vacationId})`,
      "info"
    );
    res.json({ success: true });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.DELETE_FAIL,
      `휴가 취소 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "휴가 취소 실패" });
  }
};
