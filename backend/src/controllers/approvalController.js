// controllers/approvalController.js
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");

//결재라인 api  approver 역할별 자동 fallback 포함
const getApproversForTarget = async (
  targetType,
  targetId,
  departmentCode,
  positionCode,
  req = null,
  user = null
) => {
  // 1단계: 결재자 직접 지정된 목록 조회
  const approverRows = await dbAll(
    `SELECT a.step, u.name, u.position_code, cc.label AS position_label
     FROM approvals a
     JOIN users u ON a.approver_id = u.id
     LEFT JOIN common_codes cc ON cc.code_group = 'POSITION' AND cc.code = u.position_code
     WHERE a.target_type = ? AND a.target_id = ?
     ORDER BY a.step ASC`,
    [targetType, targetId]
  );

  // 2단계: 직급 코드 기준 approvers 구성
  const approvers = {};
  for (const row of approverRows) {
    switch (row.position_code) {
      case "DEPHEAD":
        approvers.partLead = `${row.position_label} ${row.name}`;
        break;
      case "LEAD":
        approvers.teamLead = `${row.position_label} ${row.name}`;
        break;
      case "DIR":
      case "EVP":
        approvers.deptHead = `${row.position_label} ${row.name}`;
        break;
      case "CEO":
        approvers.ceo = `${row.position_label} ${row.name}`;
        break;
      default:
        if (!approvers.manager)
          approvers.manager = `${row.position_label} ${row.name}`;
    }
  }

  // 3단계: 누락된 역할 자동 보완 (common_codes의 sort_order 기준)
  const fallbackRoles = [
    { key: "partLead", label: "파트장", sortMin: 5, sortMax: 5 },
    { key: "teamLead", label: "팀장", sortMin: 4, sortMax: 4 },
    { key: "deptHead", label: "부서장", sortMin: 2, sortMax: 3 },
  ];

  for (const { key, label, sortMin, sortMax } of fallbackRoles) {
    if (!approvers[key] && departmentCode) {
      const backup = await dbGet(
        `SELECT u.name, u.position_code, cc.label AS position_label
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
        continue; // backup 없을 경우 그냥 넘어감
      }

      approvers[key] = `${backup.position_label} ${backup.name}`;
      logSystemAction(
        req,
        user, // user를 직접 받도록 바꿈!
        LOG_ACTIONS.APPROVER_AUTO_FILL,
        `자동 보완된 결재자 ${key}: ${approvers[key]}`,
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

  try {
    // 1단계: 현재 결재 대상 상태 확인
    const row = await dbGet(
      `SELECT id, status, is_final, step FROM approvals
       WHERE LOWER(target_type) = LOWER(?) AND target_id = ? AND approver_id = ?`,
      [targetType, targetId, userId]
    );

    if (!row) {
      const msg = "승인 권한 없음";
      logSystemAction(req, req.user, LOG_ACTIONS.APPROVE_FAIL, msg, "error");
      return res.status(403).json({ error: msg });
    }

    const currentStep = row.step;
    const approvalId = row.id;

    // 2단계: 결재 순서 검증 (내 차례인지 확인 ,선행 단계 확인)
    const minStepRow = await dbGet(
      `SELECT MIN(step) as minStep FROM approvals
       WHERE target_type = ? AND target_id = ? AND status = 'PENDING'`,
      [targetType, targetId]
    );

    if (currentStep > minStepRow.minStep) {
      const msg = `이전 단계 결재 미완료 (현재 step=${currentStep}, 최소 step=${minStepRow.minStep})`;
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.APPROVE_FAIL,
        "결재 권한 없음",
        "error"
      );
      return res
        .status(400)
        .json({ error: "이전 단계 결재가 완료되지 않았습니다." });
    }

    // 3단계: 승인 처리 및 이력 기록
    const updateSql = `UPDATE approvals SET status = 'APPROVED', approved_at = datetime('now') WHERE id = ?`;
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
     ) VALUES (?, ?, ?, ?, 'APPROVE', '', ?, 'PENDING', 'APPROVED')`;
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

    // 4단계: 최종 승인자일 경우 → vacation 상태 업데이트 + 이력 기록
    if (row.is_final === 1 && targetType.toLowerCase() === "vacation") {
      const vacationRow = await dbGet(
        `SELECT status, user_id FROM vacations WHERE id = ?`,
        [targetId]
      );

      if (vacationRow) {
        const vacationUpdateSql = `
          UPDATE vacations SET status = 'APPROVED', approved_by = ?, approved_at = datetime('now') WHERE id = ?`;
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
          ) VALUES (?, ?, 'APPROVE', ?, 'APPROVED', '최종 승인', ?)`;
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

    // 5. 다음 결재자에게 current_pending_step 넘기기 (최종 결재자가 아닌 경우)
    if (row.is_final !== 1) {
      const nextStepSql = `
    UPDATE approvals
    SET current_pending_step = ?
    WHERE target_type = ? AND target_id = ? AND step = ?`;

      const nextStepParams = [
        currentStep + 1,
        targetType,
        targetId,
        currentStep + 1,
      ];

      await dbRun(nextStepSql, nextStepParams);

      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.APPROVE,
        `SQL 실행: ${nextStepSql.trim()}, param=[${nextStepParams.join(", ")}]`,
        "info"
      );

      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.APPROVE,
        `다음 결재자(current_step=${currentStep + 1})에게 넘김`,
        "info"
      );
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

    const approvalId = row.id;
    const currentStep = row.step;

    // 2단계: 선행 결재 확인 (내 차례인지 검증)
    const minStepRow = await dbGet(
      `SELECT MIN(step) as minStep FROM approvals
   WHERE target_type = ? AND target_id = ? AND status = 'PENDING'`,
      [targetType, targetId]
    );

    if (currentStep > minStepRow.minStep) {
      const msg = `이전 단계 결재 미완료 (현재 step=${currentStep}, 최소 step=${minStepRow.minStep})`;
      logSystemAction(req, req.user, LOG_ACTIONS.REJECT_FAIL, msg, "error");
      return res
        .status(400)
        .json({ error: "이전 단계 결재가 완료되지 않았습니다." });
    }

    //본인 결재 라인 반려 처리
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
    // 3단계: // vacation 반려 처리
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

    // 4단계: 다른 모든 결재 라인 SKIPPED 처리
    const skipSql = `
    UPDATE approvals
    SET status = 'SKIPPED', approved_at = datetime('now')
    WHERE target_type = ? AND target_id = ? AND status = 'PENDING'`;
    await dbRun(skipSql, [targetType, targetId]);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.REJECT,
      `SQL 실행: ${skipSql}, param=[${targetType}, ${targetId}]`,
      "info"
    );

    // current_pending_step 초기화
    const clearStepSql = `
  UPDATE approvals
  SET current_pending_step = NULL
  WHERE target_type = ? AND target_id = ?`;
    await dbRun(clearStepSql, [targetType, targetId]);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.REJECT,
      `SQL 실행: ${clearStepSql}, param=[${targetType}, ${targetId}]`,
      "info"
    );
    // 5단계: 반려 이력 기록
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
    // 6단계: 성공 응답
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
      WHERE a.target_type = ? AND a.target_id = ?
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
      a.approver_id, a.current_pending_step, a.created_at, a.due_date,
      u.name AS requester_name
    FROM approvals a
    JOIN users u ON a.requester_id = u.id
    WHERE a.approver_id = ?
  `;

  const params = [userId];

  if (target_type) {
    sql += ` AND LOWER(target_type) = ?`;
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
        if (row.target_type === "vacation") {
          data = await dbGet(
            `SELECT start_date, end_date, type_code AS type_label FROM vacations WHERE id = ?`,
            [row.target_id]
          );
        } else if (row.target_type === "kpi") {
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
          current_pending_step: row.current_pending_step,
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

// 상세 보기 API (approvers 항상 포함되도록 보완)
exports.getApprovalDetail = async (req, res) => {
  const { targetType, targetId } = req.params;
  try {
    let data = null;
    let departmentCode = null;
    let positionCode = null;

    if (targetType === "vacation") {
      data = await dbGet(
        `SELECT v.start_date, v.end_date, v.type_code, v.reason, v.note, v.created_at,
                v.snapshot_name, v.snapshot_department_code, v.snapshot_position_code, u.employee_number
         FROM vacations v
         LEFT JOIN users u ON v.user_id = u.id
         WHERE v.id = ?`,
        [targetId]
      );

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
      }
    } else if (targetType === "kpi") {
      data = await dbGet(`SELECT goal_title, period FROM kpis WHERE id = ?`, [
        targetId,
      ]);

      const userInfo = await dbGet(
        `SELECT u.department_code, u.position_code
         FROM approvals a
         JOIN users u ON a.requester_id = u.id
         WHERE a.target_type = ? AND a.target_id = ?
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
    a.current_pending_step,
    a.created_at,
    a.due_date,
    u.name AS requester_name
  FROM approvals a
  JOIN users u ON a.requester_id = u.id
  WHERE a.requester_id = ?
`;
  const params = [userId];

  if (target_type) {
    sql += ` AND LOWER(a.target_type) = ?`;
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

        if ((row.target_type || "").toLowerCase() === "vacation") {
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
        } else if ((row.target_type || "").toLowerCase() === "kpi") {
          data = await dbGet(
            `SELECT goal_title, period FROM kpis WHERE id = ?`,
            [row.target_id]
          );
        } else if ((row.target_type || "").toLowerCase() === "notice") {
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
          current_pending_step: row.current_pending_step,
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
