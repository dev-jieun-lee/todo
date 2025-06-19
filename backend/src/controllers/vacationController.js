//	휴가 신청, 조회, 취소 등 사용자 요청 처리	신청자 (일반 사용자)
const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const { findOverlappingVacation } = require("../models/vacationModel");
const { createApprovalLines } = require("./approvalController");

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

/**
 * 팀 휴가 목록 조회
 * @route GET /api/vacations/team
 * @desc 현재 사용자의 팀에 속한 모든 팀원의 휴가 정보를 조회
 */
exports.getTeamVacations = async (req, res) => {
  const userId = req.user?.id;
  const { team_code, start_date, end_date } = req.query;

  if (!userId) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.ERROR,
      "사용자 ID 없음",
      "error"
    );
    return res.status(400).json({ error: "사용자 정보가 없습니다." });
  }

  try {
    // 사용자 팀 정보 확인
    const userRow = await dbGet(
      `SELECT team_code FROM users WHERE id = ?`,
      [userId]
    );
    
    if (!userRow) {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.ERROR,
        "사용자 정보 없음",
        "error"
      );
      return res.status(500).json({ error: "사용자 정보 없음" });
    }

    const targetTeamCode = team_code || userRow.team_code;

    // 팀 휴가 정보 조회
    let sql = `
      SELECT 
        v.id,
        v.user_id,
        u.name AS user_name,
        v.type_code,
        cc.label AS type_label,
        v.start_date,
        v.end_date,
        v.start_time,
        v.end_time,
        v.duration_unit,
        v.status,
        v.reason,
        v.created_at
      FROM vacations v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN common_codes cc ON cc.code_group = 'VACATION_TYPE' AND cc.code = v.type_code
      WHERE u.team_code = ?
        AND u.status = 'ACTIVE'
    `;

    const params = [targetTeamCode];

    // 날짜 필터 추가
    if (start_date && end_date) {
      sql += ` AND (
        (v.start_date BETWEEN ? AND ?) OR 
        (v.end_date BETWEEN ? AND ?) OR
        (v.start_date <= ? AND v.end_date >= ?)
      )`;
      params.push(start_date, end_date, start_date, end_date, start_date, end_date);
    }

    sql += ` ORDER BY v.start_date ASC, u.name ASC`;

    const teamVacations = await dbAll(sql, params);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `팀 휴가 정보 조회: ${teamVacations.length}건 (팀: ${targetTeamCode})`,
      "info"
    );

    res.json(teamVacations);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      `팀 휴가 조회 실패: ${err.message}`,
      "error"
    );
    return res.status(500).json({ error: "팀 휴가 조회 실패" });
  }
};

// 2. 휴가 신청
// 사용자가 휴가를 신청하며, 승인자와 이력도 함께 등록
exports.applyVacation = async (req, res) => {
  const user = req.user;
  const targetType = "VACATION";
  const {
    type_code,
    start_date,
    end_date,
    start_time,
    end_time,
    duration_unit,
    reason,
    note,
    route_name,
    department_code,
    team_code,
  } = req.body;

  logSystemAction(
    req,
    user,
    LOG_ACTIONS.READ,
    `[휴가신청] 신청 파라미터: user_id=${user.id}, dept=${department_code}, team=${team_code}, type_code=${type_code}, route=${route_name}`,
    "info"
  );

  try {
    // 1. 사용자 스냅샷 조회
    const userSnapshot = await dbGet(
      `SELECT id, name, department_code, position_code, team_code FROM users WHERE id = ?`,
      [user.id]
    );
    if (!userSnapshot) {
      logSystemAction(
        req,
        user,
        LOG_ACTIONS.ERROR,
        "[휴가신청] 신청자 정보 없음",
        "error"
      );
      return res.status(500).json({ error: "신청자 정보 없음" });
    }

    // 2. 중복 신청 확인
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
        "[휴가신청] 중복 신청된 휴가 있음",
        "error"
      );
      return res.status(400).json({ error: "중복 신청된 휴가 있음" });
    }

    // 3. 휴가 DB 저장
    const result = await dbRun(
      `INSERT INTO vacations (
        user_id, type_code, start_date, end_date, start_time, end_time,
        duration_unit, reason, note, status, created_at,
        snapshot_name, snapshot_department_code, snapshot_position_code
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
    logSystemAction(
      req,
      user,
      LOG_ACTIONS.CREATE,
      `[휴가신청] vacations 저장 완료 (ID:${vacationId})`,
      "info"
    );

    // 4. 휴가 이력 저장
    await dbRun(
      `INSERT INTO vacation_history (
        vacation_id, user_id, action, old_value, new_value, memo, admin_id
      ) VALUES (?, ?, 'REQUESTED', '', 'PENDING', ?, ?)`,
      [vacationId, user.id, reason || "휴가 신청", user.id]
    );
    logSystemAction(
      req,
      user,
      LOG_ACTIONS.CREATE,
      `[휴가신청] vacation_history 저장 (ID:${vacationId})`,
      "info"
    );

    // 5. 결재선 생성 (직급 조건 포함) → 실패시 예외/로그 처리
    let approvals;
    try {
      approvals = await createApprovalLines({
        targetType,
        targetId: vacationId,
        routeName: route_name,
        applicant: userSnapshot,
        req,
      });
      logSystemAction(
        req,
        user,
        LOG_ACTIONS.CREATE,
        `[휴가신청] approvals 결재라인 자동생성 완료 (vacationId: ${vacationId}, approvals: ${approvals.length})`,
        "info"
      );
    } catch (approvalErr) {
      logSystemAction(
        req,
        user,
        LOG_ACTIONS.CREATE_FAIL,
        `[휴가신청] 결재선 자동생성 실패: ${approvalErr.message}`,
        "error"
      );
      // 롤백을 원하면 vacations/vacation_history도 삭제
      await dbRun(`DELETE FROM vacations WHERE id = ?`, [vacationId]);
      await dbRun(`DELETE FROM vacation_history WHERE vacation_id = ?`, [
        vacationId,
      ]);
      return res
        .status(500)
        .json({ error: "결재선 생성 실패(직급 조건 불일치)" });
    }

    // 6. approval_history 신청 이력 저장
    for (const approval of approvals) {
      await dbRun(
        `INSERT INTO approval_history (
          approval_id, target_type, target_id, step,
          action, memo, actor_id, prev_status, new_status
        ) VALUES (?, ?, ?, ?, 'REQUESTED', ?, ?, ?, ?)`,
        [
          approval.approvalId,
          targetType,
          vacationId,
          approval.step,
          "휴가 신청",
          user.id,
          null,
          "PENDING",
        ]
      );
    }
    logSystemAction(
      req,
      user,
      LOG_ACTIONS.CREATE,
      `[휴가신청] approval_history 신청 이력 저장 완료`,
      "info"
    );
    // 7. 성공 응답
    res.json({ success: true, vacationId });
  } catch (err) {
    logSystemAction(
      req,
      user,
      LOG_ACTIONS.CREATE_FAIL,
      `[휴가신청] 전체 실패: ${err.message}`,
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
    console.log(
      "[cancelVacation] 취소 시도, vacationId:",
      vacationId,
      "userId:",
      userId
    );
    console.log(
      "[cancelVacation] 취소 전 vacation 상태:",
      vacation && vacation.status
    );
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
