// controllers/approvalController.js
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");
/**
 * 결재자 fallback 자동보완 (partLead/teamLead/...)
 * @desc 결재자 미지정시 부서/직급별 자동 후보 검색
 * @returns {Promise<Object>} approvers 객체(role별)
 */
const getApproversForTarget = async (
  targetType,
  targetId,
  departmentCode,
  positionCode,
  req = null,
  user = null
) => {
  // 1단계: 결재자 직접 지정된 목록 조회 (status, approved_at, proxy_type, proxy_role 포함!)
  const approverRows = await dbAll(
    `SELECT a.step, u.name, u.position_code, a.approver_id, cc.label AS position_label,
            a.status, a.approved_at, a.proxy_type, a.proxy_role
     FROM approvals a
     JOIN users u ON a.approver_id = u.id
     LEFT JOIN common_codes cc ON cc.code_group = 'POSITION' AND cc.code = u.position_code
     WHERE UPPER(a.target_type) = UPPER(?) AND a.target_id = ?
     ORDER BY a.step ASC`,
    [targetType, targetId]
  );

  // 2단계: 직급 코드 기준 approvers 구성
  const approvers = {};
  for (const row of approverRows) {
    let role = "";
    switch (row.position_code) {
      case "DEPHEAD":
        role = "partLead";
        break;
      case "LEAD":
        role = "teamLead";
        break;
      case "DIR":
      case "EVP":
        role = "deptHead";
        break;
      case "CEO":
        role = "ceo";
        break;
      default:
        role = "manager";
    }
    // 실제 할당(프론트 요구 shape, proxy_type, proxy_role 등 포함!)
    approvers[role] = {
      name: `${row.position_label} ${row.name}`,
      id: row.approver_id,
      status: row.status,
      approvedAt: row.approved_at,
      proxy_type: row.proxy_type || null,
      proxy_role: row.proxy_role || null,
    };
  }

  // 3단계: 누락된 역할 자동 보완 (common_codes의 sort_order 기준)
  const fallbackRoles = [
    { key: "partLead", label: "파트장", sortMin: 5, sortMax: 5 },
    { key: "teamLead", label: "팀장", sortMin: 4, sortMax: 4 },
    { key: "deptHead", label: "부서장", sortMin: 2, sortMax: 3 },
  ];

  for (const { key, label, sortMin, sortMax } of fallbackRoles) {
    if (!approvers[key] && departmentCode) {
      // 1) 우선 backup(후보자) 찾기
      const backup = await dbGet(
        `SELECT u.name, u.position_code, u.id as approver_id, cc.label AS position_label
         FROM users u
         JOIN common_codes cc ON cc.code_group = 'POSITION' AND cc.code = u.position_code
         WHERE u.status = 'ACTIVE' AND u.department_code = ? AND cc.sort_order BETWEEN ? AND ?
         ORDER BY cc.sort_order ASC LIMIT 1`,
        [departmentCode, sortMin, sortMax]
      );

      if (!backup) {
        console.warn(
          `⚠️ [결재자 자동 보완 실패] ${key} 없음 - 부서: ${departmentCode}, 직급: ${label} (sort_order ${sortMin}~${sortMax})`
        );
        continue;
      }

      // 2) 이 backup이 실제 결재라인에 이미 등록돼 있는지 확인
      const approvalRow = await dbGet(
        `SELECT status, approved_at, proxy_type, proxy_role FROM approvals
         WHERE UPPER(target_type) = UPPER(?) AND target_id = ? AND approver_id = ?`,
        [targetType, targetId, backup.approver_id]
      );

      approvers[key] = {
        name: `${backup.position_label} ${backup.name}`,
        id: backup.approver_id,
        status: approvalRow ? approvalRow.status : "PENDING",
        approvedAt: approvalRow ? approvalRow.approved_at : null,
        proxy_type: approvalRow ? approvalRow.proxy_type : null,
        proxy_role: approvalRow ? approvalRow.proxy_role : null,
      };

      logSystemAction(
        req,
        user,
        LOG_ACTIONS.APPROVER_AUTO_FILL,
        `자동 보완된 결재자 ${key}: ${JSON.stringify(approvers[key])}`,
        "info"
      );
    }
  }

  return approvers;
};

//결재 승인 처리
exports.approve = async (req, res) => {
  const { targetType, targetId } = req.params;
  const userId = req.user.id;
  console.log("[approvalController/approve] 파라미터:", {
    targetType,
    targetId,
    userId,
  });

  try {
    // 1단계: 현재 결재 대상 상태 확인 (PENDING만 승인 가능)
    const row = await dbGet(
      `SELECT id, status, is_final, step FROM approvals
       WHERE UPPER(target_type) = UPPER(?) AND target_id = ? AND approver_id = ?`,
      [targetType, targetId, userId]
    );

    if (!row) {
      const msg = "승인 권한 없음";
      logSystemAction(req, req.user, LOG_ACTIONS.APPROVE_FAIL, msg, "error");
      return res.status(403).json({ error: msg });
    }

    if (row.status !== "PENDING") {
      const msg = `이미 처리된 결재라인입니다. (현재상태: ${row.status})`;
      logSystemAction(req, req.user, LOG_ACTIONS.APPROVE_FAIL, msg, "warn");
      return res.status(400).json({ error: msg });
    }

    const currentStep = row.step;
    const approvalId = row.id;

    // 2단계: 결재 순서 검증 (내 차례인지, 선행단계 완료 확인)
    const minStepRow = await dbGet(
      `SELECT MIN(step) as minStep FROM approvals
       WHERE UPPER(target_type) = UPPER(?) AND target_id = ? AND status = 'PENDING'`,
      [targetType, targetId]
    );

    if (currentStep > minStepRow.minStep) {
      const msg = `이전 단계 결재 미완료 (현재 step=${currentStep}, 최소 step=${minStepRow.minStep})`;
      logSystemAction(req, req.user, LOG_ACTIONS.APPROVE_FAIL, msg, "error");
      return res
        .status(400)
        .json({ error: "이전 단계 결재가 완료되지 않았습니다." });
    }
    console.log(
      "[approvalController/approve] 승인 처리 전 status:",
      row.status
    );

    // 3단계: 승인 처리 및 이력 기록
    const updateSql = `
      UPDATE approvals
      SET status = 'APPROVED', approved_at = datetime('now')
      WHERE id = ?
    `;
    await dbRun(updateSql, [approvalId]);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.APPROVE,
      `결재 승인 처리: ${updateSql} → ${approvalId}`,
      "info"
    );

    // 승인 이력 기록
    const insertHistorySql = `
      INSERT INTO approval_history (
        approval_id, target_type, target_id, step,
        action, memo, actor_id, prev_status, new_status
      ) VALUES (?, ?, ?, ?, 'APPROVE', '', ?, 'PENDING', 'APPROVED')
    `;
    await dbRun(insertHistorySql, [
      approvalId,
      targetType,
      targetId,
      currentStep,
      userId,
    ]);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.APPROVE,
      `이력 기록: approval_id=${approvalId}, step=${currentStep}, SQL=${insertHistorySql}`,
      "info"
    );

    // 5단계: 최종 승인자일 경우 → vacation 등 target status 업데이트 + 이력 기록
    if (row.is_final === 1 && targetType.toLowerCase() === "vacation") {
      const vacationRow = await dbGet(
        `SELECT status, user_id FROM vacations WHERE id = ?`,
        [targetId]
      );

      if (vacationRow) {
        const vacationUpdateSql = `
          UPDATE vacations
          SET status = 'APPROVED', approved_by = ?, approved_at = datetime('now')
          WHERE id = ?
        `;
        await dbRun(vacationUpdateSql, [userId, targetId]);
        logSystemAction(
          req,
          req.user,
          LOG_ACTIONS.APPROVE,
          `SQL 실행: ${vacationUpdateSql}, param=[${userId}, ${targetId}]`,
          "info"
        );

        const vacationHistorySql = `
          INSERT INTO vacation_history (
            vacation_id, user_id, action, old_value, new_value, memo, admin_id
          ) VALUES (?, ?, 'APPROVE', ?, 'APPROVED', '최종 승인', ?)
        `;
        await dbRun(vacationHistorySql, [
          targetId,
          vacationRow.user_id,
          vacationRow.status,
          userId,
        ]);
        logSystemAction(
          req,
          req.user,
          LOG_ACTIONS.APPROVE,
          `SQL 실행: ${vacationHistorySql}, param=[${targetId}, ${vacationRow.user_id}, ${vacationRow.status}, ${userId}]`,
          "info"
        );

        logSystemAction(
          req,
          req.user,
          LOG_ACTIONS.APPROVE,
          `최종 승인으로 휴가 상태 반영 완료 (vacationId: ${targetId})`,
          "info"
        );
      } else {
        logSystemAction(
          req,
          req.user,
          LOG_ACTIONS.APPROVE_FAIL,
          "휴가 정보 없음",
          "error"
        );
      }
    }

    // 6단계: 승인 성공 응답
    res.json({ success: true });
  } catch (err) {
    const errMsg = `승인 실패: ${err.message}`;
    logSystemAction(req, req.user, LOG_ACTIONS.APPROVE_FAIL, errMsg, "error");
    res.status(500).json({
      error: "승인 실패",
      errorMessage: err.message, // 운영환경에서는 제거 가능
    });
  }
};

// 반려 처리
exports.reject = async (req, res) => {
  const { targetType, targetId } = req.params;
  const userId = req.user.id;
  const { memo = "반려 처리" } = req.body;

  try {
    // 1단계: 현재 결재 대상 상태 확인
    const row = await dbGet(
      `SELECT id, status, step FROM approvals
       WHERE LOWER(target_type) = LOWER(?) AND target_id = ? AND approver_id = ?`,
      [targetType, targetId, userId]
    );

    if (!row) {
      const msg = "반려 권한 없음";
      logSystemAction(req, req.user, LOG_ACTIONS.REJECT_FAIL, msg, "error");
      return res.status(403).json({ error: msg });
    }

    if (row.status !== "PENDING") {
      const msg = `이미 처리된 결재라인입니다. (현재상태: ${row.status})`;
      logSystemAction(req, req.user, LOG_ACTIONS.REJECT_FAIL, msg, "warn");
      return res.status(400).json({ error: msg });
    }

    const approvalId = row.id;
    const currentStep = row.step;

    // 2단계: 선행 결재 확인 (내 차례인지 검증)
    const minStepRow = await dbGet(
      `SELECT MIN(step) as minStep FROM approvals
       WHERE UPPER(target_type) = UPPER(?) AND target_id = ? AND status = 'PENDING'`,
      [targetType, targetId]
    );

    if (currentStep > minStepRow.minStep) {
      const msg = `이전 단계 결재 미완료 (현재 step=${currentStep}, 최소 step=${minStepRow.minStep})`;
      logSystemAction(req, req.user, LOG_ACTIONS.REJECT_FAIL, msg, "error");
      return res
        .status(400)
        .json({ error: "이전 단계 결재가 완료되지 않았습니다." });
    }

    // 3단계: 본인 결재 라인 반려 처리
    const rejectSql = `
      UPDATE approvals SET status = 'REJECTED', memo = ?, approved_at = datetime('now')
      WHERE id = ?`;
    await dbRun(rejectSql, [memo, approvalId]);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.REJECT,
      `SQL 실행: ${rejectSql}, param=[${memo}, ${approvalId}]`,
      "info"
    );

    // 4단계: vacation 등 결재 대상도 REJECTED 처리(최종 결재자가 아니더라도)
    if (targetType.toLowerCase() === "vacation") {
      const vacationRejectSql = `UPDATE vacations SET status = 'REJECTED' WHERE id = ?`;
      await dbRun(vacationRejectSql, [targetId]);
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.REJECT,
        `SQL 실행: ${vacationRejectSql}, param=[${targetId}]`,
        "info"
      );

      const vacationRow = await dbGet(
        `SELECT user_id, status FROM vacations WHERE id = ?`,
        [targetId]
      );

      // vacation 이력 기록
      if (vacationRow) {
        const vacationHistorySql = `
          INSERT INTO vacation_history (
            vacation_id, user_id, action, old_value, new_value, memo, admin_id
          ) VALUES (?, ?, 'REJECTED', ?, 'REJECTED', ?, ?)`;
        await dbRun(vacationHistorySql, [
          targetId,
          vacationRow.user_id,
          vacationRow.status,
          memo,
          userId,
        ]);
        logSystemAction(
          req,
          req.user,
          LOG_ACTIONS.REJECT,
          `SQL 실행: ${vacationHistorySql}, param=[${targetId}, ${vacationRow.user_id}, ${vacationRow.status}, ${memo}, ${userId}]`,
          "info"
        );
      }
    }

    // 5단계: 다른 모든 결재 라인 SKIPPED 처리 (PENDING만)
    const skipSql = `
      UPDATE approvals
      SET status = 'SKIPPED', approved_at = datetime('now')
      WHERE UPPER(target_type) = UPPER(?) AND target_id = ? AND status = 'PENDING'`;
    await dbRun(skipSql, [targetType, targetId]);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.REJECT,
      `SQL 실행: ${skipSql}, param=[${targetType}, ${targetId}]`,
      "info"
    );

    //  6단계: 반려 이력 기록
    const insertHistorySql = `
      INSERT INTO approval_history (
        approval_id, target_type, target_id, step,
        action, memo, actor_id, prev_status, new_status
      ) VALUES (?, ?, ?, ?, 'REJECT', ?, ?, 'PENDING', 'REJECTED')`;
    await dbRun(insertHistorySql, [
      approvalId,
      targetType,
      targetId,
      currentStep,
      memo,
      userId,
    ]);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.REJECT,
      `SQL 실행: ${insertHistorySql}, param=[${approvalId}, ${targetType}, ${targetId}, ${currentStep}, ${memo}, ${userId}]`,
      "info"
    );

    // 7단계: 성공 응답
    res.json({ success: true });
  } catch (err) {
    const msg = `반려 실패: ${err.message}`;
    logSystemAction(req, req.user, LOG_ACTIONS.REJECT_FAIL, msg, "error");
    res.status(500).json({ error: "반려 실패" });
  }
};

// 승인 이력 조회
exports.getApprovalHistory = async (req, res) => {
  const { targetType, targetId } = req.params;
  try {
    const sql = `
      SELECT a.*,
             u.name AS actor_name,
             d.label AS department_label,
             p.label AS position_label,
             a.performed_at AS history_created_at
      FROM approval_history a
      LEFT JOIN users u ON a.actor_id = u.id
      LEFT JOIN common_codes d ON d.code_group = 'DEPARTMENT' AND d.code = u.department_code
      LEFT JOIN common_codes p ON p.code_group = 'POSITION' AND p.code = u.position_code
      WHERE UPPER(a.target_type) = UPPER(?) AND a.target_id = ?
      ORDER BY a.performed_at DESC`;

    const params = [targetType, targetId];

    const rows = await dbAll(sql, params);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `승인 이력 조회 성공: ${sql}, param=${JSON.stringify(params)}`,
      "info"
    );

    res.json(rows);
  } catch (err) {
    const msg = `승인 이력 조회 실패: ${err.message}`;
    logSystemAction(req, req.user, LOG_ACTIONS.READ_FAIL, msg, "error");
    res.status(500).json({ error: "이력 조회 실패" });
  }
};

//나의 결재문서함
exports.getMyApprovalDocuments = async (req, res) => {
  const userId = req.user.id;
  const { target_type } = req.query;

  let sql = `
  SELECT
      a.id, a.target_type, a.target_id, a.status, a.step,
      a.approver_id, a.created_at, a.due_date,
      u.name AS requester_name
    FROM approvals a
    JOIN users u ON a.requester_id = u.id
    WHERE a.approver_id = ?
  `;

  const params = [userId];

  if (target_type) {
    sql += ` AND UPPER(target_type) = UPPER(?)`;
    params.push(target_type.toLowerCase());
  }

  sql += ` ORDER BY a.created_at ASC`;
  // SQL 쿼리 실행 전에 로그 기록
  logSystemAction(
    req,
    req.user,
    LOG_ACTIONS.READ,
    `나의 결재문서함 조회: ${sql}, param=${JSON.stringify(params)}`,
    "info"
  );

  try {
    const rows = await dbAll(sql, params);
    const enriched = await Promise.all(
      rows.map(async (row) => {
        let data = null;
        if ((row.target_type || "").toUpperCase() === "VACATION") {
          data = await dbGet(
            `SELECT start_date, end_date, type_code AS type_label FROM vacations WHERE id = ?`,
            [row.target_id]
          );
        } else if ((row.target_type || "").toUpperCase() === "KPI") {
          data = await dbGet(
            `SELECT goal_title, period FROM kpis WHERE id = ?`,
            [row.target_id]
          );
        }

        return {
          id: row.id,
          targetType: row.target_type.toUpperCase(),
          targetId: row.target_id,
          requesterName: row.requester_name,
          status: row.status,
          step: row.step,
          approver_id: row.approver_id,
          createdAt: row.created_at,
          dueDate: row.due_date,
          data,
          currentUserId: userId,
        };
      })
    );
    res.json(enriched);
  } catch (err) {
    const msg = `내가 승인할 항목 목록 조회 실패: ${err.message}`;
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      "내가 승인할 항목 목록 조회 실패",
      "error"
    );
    res.status(500).json({ error: "조회 실패" });
  }
};

// 결재자 직급 정보 조회
exports.getPositionLabel = async (req, res) => {
  const targetId = req.params.targetId;
  try {
    const row = await dbGet(
      `SELECT dept.label AS department_label, pos.label AS position_label
       FROM approvals a
       JOIN users u ON a.approver_id = u.id
       LEFT JOIN common_codes dept ON u.department_code = dept.code
       LEFT JOIN common_codes pos ON u.position_code = pos.code
       WHERE a.target_id = ?
       LIMIT 1`,
      [targetId]
    );

    if (!row) {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.READ_FAIL,
        "결재자 정보 없음",
        "error"
      );
      return res.status(404).json({ error: "결재자 정보 없음" });
    }

    const positionLabel = row.position_label || "(직급 없음)";
    const departmentLabel = row.department_label || "(부서 없음)";
    const combinedLabel = `${departmentLabel} ${positionLabel}`;

    res.json({
      department_label: departmentLabel,
      position_label: positionLabel,
      full_label: combinedLabel,
    });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      "결재자 부서/직급 조회 실패",
      "error"
    );
    res.status(500).json({ error: "결재자 정보 조회 실패" });
  }
};

// 상세 보기 API
exports.getApprovalDetail = async (req, res) => {
  const { targetType, targetId } = req.params;
  try {
    let data = null;
    let departmentCode = null;
    let positionCode = null;

    // "누구 차례" 계산식
    const pendingRow = await dbGet(
      `SELECT step, approver_id, status FROM approvals
       WHERE UPPER(target_type) = UPPER(?) AND target_id = ? AND status = 'PENDING'
       ORDER BY step ASC LIMIT 1`,
      [targetType, targetId]
    );
    const currentApproverId = pendingRow?.approver_id || null; // ★ 추가!
    if ((targetType || "").toUpperCase() === "VACATION") {
      data = await dbGet(
        `SELECT v.start_date, v.end_date, v.type_code, v.reason, v.note, v.created_at,
                v.snapshot_name, v.snapshot_department_code, v.snapshot_position_code, u.employee_number
         FROM vacations v
         LEFT JOIN users u ON v.user_id = u.id
         WHERE v.id = ?`,
        [targetId]
      );
      console.log("pendingRow:", pendingRow);
      if (data) {
        departmentCode = data.snapshot_department_code;
        positionCode = data.snapshot_position_code;
        data.approvers = await getApproversForTarget(
          targetType,
          targetId,
          departmentCode,
          positionCode,
          req,
          req.user
        );
        data.approverIds = {};
        Object.entries(data.approvers).forEach(([role, info]) => {
          data.approverIds[role] = info.id;
        });
        data.currentApproverId = currentApproverId;
      }
    } else if ((targetType || "").toUpperCase() === "KPI") {
      data = await dbGet(`SELECT goal_title, period FROM kpis WHERE id = ?`, [
        targetId,
      ]);

      const userInfo = await dbGet(
        `SELECT u.department_code, u.position_code
         FROM approvals a
         JOIN users u ON a.requester_id = u.id
         WHERE UPPER(a.target_type) = UPPER(?) AND a.target_id = ?
         LIMIT 1`,
        [targetType, targetId]
      );

      if (data && userInfo) {
        data.approvers = await getApproversForTarget(
          targetType,
          targetId,
          userInfo.department_code,
          userInfo.position_code,
          req,
          req.user
        );
      }
    }

    if (!data) {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.READ_FAIL,
        "상세 데이터 없음",
        "error"
      );
      return res.status(404).json({ error: "상세 데이터 없음" });
    }

    res.json({
      id: Number(targetId),
      targetType,
      targetId: Number(targetId),
      status: pendingRow ? pendingRow.status : null,
      currentApproverId: currentApproverId, // 계산한 값
      data,
    });
  } catch (err) {
    logSystemAction(
      req,
      req.user ?? null,
      LOG_ACTIONS.READ_FAIL,
      `상세 조회 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "상세 조회 실패" });
  }
};

exports.getRequestedApprovals = async (req, res) => {
  const userId = req.user.id;
  const { target_type } = req.query;

  let sql = `
  SELECT
    a.id,
    a.target_type,
    a.target_id,
    a.status,
    a.step,
     a.approver_id,
    a.created_at,
    a.due_date,
    u.name AS requester_name
  FROM approvals a
  JOIN users u ON a.requester_id = u.id
  WHERE a.requester_id = ?
`;
  const params = [userId];

  if (target_type) {
    sql += ` AND  UPPER(target_type) = UPPER(?)`;
    params.push(target_type.toLowerCase());
  }

  sql += ` ORDER BY a.created_at DESC`;
  logSystemAction(
    req,
    req.user,
    LOG_ACTIONS.READ,
    `내가 요청한 승인 목록 조회: SQL = ${sql}, Params = ${JSON.stringify(
      params
    )}`,
    "info"
  );

  try {
    const rows = await dbAll(sql, params);

    // 데이터 매핑 및 처리
    const enriched = await Promise.all(
      rows.map(async (row) => {
        let data = null;

        if ((row.target_type || "").toUpperCase() === "VACATION") {
          data = await dbGet(
            `SELECT
                v.start_date,
                v.end_date,
                v.type_code,
                cc.label AS type_label
             FROM vacations v
             LEFT JOIN common_codes cc
               ON cc.code_group = 'VACATION_TYPE' AND cc.code = v.type_code
             WHERE v.id = ?`,
            [row.target_id]
          );
        } else if ((row.target_type || "").toUpperCase() === "KPI") {
          data = await dbGet(
            `SELECT goal_title, period FROM kpis WHERE id = ?`,
            [row.target_id]
          );
        } else if ((row.target_type || "").toUpperCase() === "NOTICE") {
          data = await dbGet(
            `SELECT title, target_role AS target_label FROM notices WHERE id = ?`,
            [row.target_id]
          );
        }

        return {
          id: row.id,
          targetType: (row.target_type || "").toUpperCase(),
          targetId: row.target_id,
          requesterName: row.requester_name,
          createdAt: row.created_at,
          dueDate: row.due_date,
          status: row.status,
          step: row.step,
          approver_id: row.approver_id,
          data,
          currentUserId: userId,
        };
      })
    );

    //console.log("enriched result:", enriched);
    res.json(enriched);
  } catch (err) {
    logSystemAction(
      req,
      req.user ?? null,
      LOG_ACTIONS.READ_FAIL,
      `내가 요청한 승인 목록 조회 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "조회 실패" });
  }
};

/**
 * approval_lines 테이블을 기준으로 approvals(결재라인) 자동생성
 * @param {Object} params - { targetType, targetId, applicant, req, routeName }
 * @returns {Promise<Array>} 생성된 approvals row의 approverId 목록
 * @desc 휴가/공지 등 결재 대상 생성 시 결재선 자동 생성 (approval_lines → approvals)
 */
exports.createApprovalLines = async ({
  targetType,
  targetId,
  applicant,
  req,
  routeName = "basic", // ← 기본값이지만, 필요시 원하는 결재선명으로 호출 가능
}) => {
  try {
    logSystemAction(
      req,
      applicant,
      LOG_ACTIONS.READ,
      `[결재선생성] 신청자 정보: id=${applicant.id}, dept=${applicant.department_code}, team=${applicant.team_code}, position=${applicant.position_code}, route=${routeName}`,
      "info"
    );
    // 1. 결재라인 전체 조회 (로그)
    const allLines = await dbAll(
      `SELECT * FROM approval_lines
         WHERE doc_type = ?
           AND department_code = ?
           AND team_code = ?
           AND route_name = ?
         ORDER BY step ASC`,
      [targetType, applicant.department_code, applicant.team_code, routeName]
    );
    logSystemAction(
      req,
      applicant,
      LOG_ACTIONS.READ,
      `[결재선생성] 불러온 결재라인 전체 개수: ${allLines.length}`,
      "info"
    );

    // 2. 신청자 직급 조건으로 필터링 (condition_expression)
    const filteredLines = allLines.filter((line) => {
      if (!line.condition_expression) return true;
      const expr = line.condition_expression.trim();
      // IN 조건
      if (expr.startsWith("applicant_role IN")) {
        const matches = expr.match(/\((.*?)\)/);
        if (matches) {
          const roles = matches[1]
            .replace(/'/g, "")
            .split(",")
            .map((x) => x.trim());
          return roles.includes(applicant.position_code);
        }
      }
      // = 조건
      else if (expr.startsWith("applicant_role=")) {
        const role = expr.split("=")[1].replace(/'/g, "").trim();
        return applicant.position_code === role;
      }
      return false;
    });
    logSystemAction(
      req,
      applicant,
      LOG_ACTIONS.READ,
      `[결재선생성] 신청자 직급(${applicant.position_code})에 맞는 결재라인 개수: ${filteredLines.length}`,
      "info"
    );

    if (!filteredLines.length) {
      logSystemAction(
        req,
        applicant,
        LOG_ACTIONS.CREATE_FAIL,
        `[결재선생성] 조건에 맞는 결재선 없음 (position_code=${applicant.position_code})`,
        "error"
      );
      throw new Error("결재선 미설정(직급 조건 불일치)");
    }

    // approvalId, approverId, step 정보를 담을 배열
    const createdApprovers = [];

    for (let i = 0; i < filteredLines.length; i++) {
      const line = filteredLines[i];
      let approverId = null;

      // SKIP 라인은 건너뜀(로그)
      if (line.proxy_type === "SKIP") {
        logSystemAction(
          req,
          applicant,
          LOG_ACTIONS.CREATE,
          `[결재선생성] step ${line.step}: SKIP(대각선), approvals 미생성`,
          "info"
        );
        continue;
      }

      // ORIGINAL(본인결재)
      if (applicant.position_code === line.role_code) {
        approverId = applicant.id;
      }
      // PROXY(전결)
      else if (line.proxy_type === "PROXY") {
        const proxyUser = await dbGet(
          `SELECT id FROM users WHERE department_code = ? AND position_code = ? AND status='ACTIVE' LIMIT 1`,
          [applicant.department_code, line.proxy_role]
        );
        approverId = proxyUser?.id;
      }
      // 일반 결재자(역할기반)
      else {
        const user = await dbGet(
          `SELECT id FROM users WHERE department_code = ? AND position_code = ? AND status='ACTIVE' LIMIT 1`,
          [applicant.department_code, line.role_code]
        );
        approverId = user?.id;
      }

      // 결재자 없는 경우
      if (!approverId) {
        if (line.is_required) {
          logSystemAction(
            req,
            applicant,
            LOG_ACTIONS.CREATE_FAIL,
            `[결재선생성] step ${line.step}: 필수 결재자 없음 (role_code=${line.role_code})`,
            "error"
          );
          throw new Error(`[결재선생성] step ${line.step} 필수 결재자 없음`);
        } else {
          logSystemAction(
            req,
            applicant,
            LOG_ACTIONS.CREATE,
            `[결재선생성] step ${line.step}: 옵션 결재자 없음, SKIP`,
            "warn"
          );
          continue;
        }
      }

      // approvals row 생성
      try {
        const result = await dbRun(
          `INSERT INTO approvals (
            target_type, target_id, requester_id, approver_id, step,
            status, is_final, created_at,
            proxy_type, proxy_role
          ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, datetime('now'), ?, ?)`,
          [
            targetType,
            targetId,
            applicant.id,
            approverId,
            line.step,
            i === filteredLines.length - 1 ? 1 : 0,
            line.proxy_type,
            line.proxy_role,
          ]
        );
        createdApprovers.push({
          approvalId: result.lastID,
          approverId,
          step: line.step,
        });
        logSystemAction(
          req,
          applicant,
          LOG_ACTIONS.CREATE,
          `[결재선생성] step ${line.step} approvals 생성: approvalId=${result.lastID}, approverId=${approverId}`,
          "info"
        );
      } catch (insertErr) {
        logSystemAction(
          req,
          applicant,
          LOG_ACTIONS.CREATE_FAIL,
          `[결재선생성] step ${line.step}: approvals INSERT 실패 - ${insertErr.message}`,
          "error"
        );
        throw insertErr;
      }
    }

    logSystemAction(
      req,
      applicant,
      LOG_ACTIONS.CREATE,
      `[결재선생성] approvals 총 생성 개수: ${createdApprovers.length}`,
      "info"
    );
    return createdApprovers;
  } catch (err) {
    logSystemAction(
      req,
      applicant,
      LOG_ACTIONS.CREATE_FAIL,
      `[결재선생성] 전체 실패: ${err.message}`,
      "error"
    );
    throw err;
  }
};

/**
 * 결재라인별 결재자 자동 Fallback 포함 (user_id→직급→상위직급)
 * @route GET /api/approval-lines
 * @desc 결재선 조회 - approval_lines 기준 + 후보자(users) Fallback 포함
 * @returns {Array} 각 결재라인 + candidates
 */
exports.getApprovalLines = async (req, res) => {
  const { doc_type, department_code, team_code, route_name } = req.query;
  console.log("[GET /api/approval-lines] params:", {
    doc_type,
    department_code,
    team_code,
    route_name,
  });

  try {
    // 1. 결재라인 SELECT (role_label, proxy_type 포함)
    const approvalLines = await dbAll(
      `
      SELECT al.*, cc.label AS role_label
      FROM approval_lines al
      LEFT JOIN common_codes cc
        ON cc.code_group = 'POSITION' AND cc.code = al.role_code
      WHERE al.doc_type = ?
        AND al.department_code = ?
        AND al.team_code = ?
        AND al.route_name = ?
      ORDER BY al.step ASC
      `,
      [doc_type, department_code, team_code, route_name]
    );

    // 2. 각 결재라인별로 후보자(users) SELECT해서 붙이기
    const result = [];
    for (const line of approvalLines) {
      let candidates = [];

      // 1) user_id 직접 지정(우선순위)
      if (line.user_id) {
        const user = await dbGet(
          `SELECT u.id, u.name, u.position_code, cc.label AS position_label
         FROM users u
         LEFT JOIN common_codes cc ON cc.code_group = 'POSITION' AND cc.code = u.position_code
         WHERE u.id = ? AND u.status = 'ACTIVE'`,
          [line.user_id]
        );
        if (user) candidates = [user];
      }
      // 2) 같은 직급 후보
      if (candidates.length === 0 && line.role_code) {
        candidates = await dbAll(
          `SELECT u.id, u.name, u.position_code, cc.label AS position_label
           FROM users u
           LEFT JOIN common_codes cc ON cc.code_group = 'POSITION' AND cc.code = u.position_code
           WHERE u.department_code = ? AND u.team_code = ? AND u.position_code = ? AND u.status = 'ACTIVE'`,
          [department_code, line.team_code, line.role_code]
        );
      }

      // 3) team_code 조건 없이 후보 (부장 등)
      if (candidates.length === 0 && line.role_code) {
        candidates = await dbAll(
          `SELECT u.id, u.name, u.position_code, cc.label AS position_label
                 FROM users u
                 LEFT JOIN common_codes cc ON cc.code_group = 'POSITION' AND cc.code = u.position_code
                 WHERE u.department_code = ? AND u.position_code = ? AND u.status = 'ACTIVE'`,
          [department_code, line.role_code]
        );
      }
      result.push({
        id: line.id,
        step: line.step,
        role_code: line.role_code,
        role_label: line.role_label || "",
        proxy_type: line.proxy_type,
        proxy_role: line.proxy_role,
        note: line.note,
        candidates, // [{id, name, position_code, position_label}, ...]
      });
    }

    console.log("[GET /api/approval-lines] result:", result);
    res.json({ approvalLines: result });
  } catch (error) {
    console.error("approvalLines 조회 실패:", error);
    res.status(500).json({ error: "결재선 조회 실패" });
  }
};
