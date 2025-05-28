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
      `UPDATE approvals SET status = 'REJECTED', memo = ?, approved_at = datetime('now') WHERE target_type = ? AND target_id = ? AND approver_id = ?`,
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

// 4. 승인 이력 조회
exports.getApprovalHistory = async (req, res) => {
  const { targetType, targetId } = req.params;
  try {
    const rows = await dbAll(
      `SELECT a.*, u.name AS approver_name FROM approvals a JOIN users u ON a.approver_id = u.id WHERE target_type = ? AND target_id = ? ORDER BY step ASC, approved_at ASC`,
      [targetType, targetId]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ 이력 조회 실패:", err);
    res.status(500).json({ error: "이력 조회 실패" });
  }
};

// 5. 내가 요청한 승인 목록 조회
exports.getRequestedApprovals = async (req, res) => {
  const userId = req.user.id;
  const { target_type } = req.query;

  let sql = `
    SELECT
      a.id, a.target_type, a.target_id, a.created_at, a.due_date,
      u.name AS requester_name
    FROM approvals a
    JOIN users u ON a.requester_id = u.id
    WHERE a.requester_id = ?
  `;
  const params = [userId];

  if (target_type) {
    sql += ` AND target_type = ?`;
    params.push(target_type);
  }
  sql += ` ORDER BY a.created_at DESC`;

  try {
    const rows = await dbAll(sql, params);
    const enrichedRows = await Promise.all(
      rows.map(async (row) => {
        let data = null;
        if ((row.target_type || "").toLowerCase() === "vacation") {
          data = await dbGet(
            `SELECT start_date, end_date, type_code AS type_label FROM vacations WHERE id = ?`,
            [row.target_id]
          );
        } else if ((row.target_type || "").toLowerCase() === "kpi") {
          data = await dbGet(
            `SELECT goal_title, period FROM kpis WHERE id = ?`,
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
          data,
        };
      })
    );
    res.json(enrichedRows);
  } catch (err) {
    console.error("❌ 내가 요청한 승인 목록 조회 실패:", err);
    res.status(500).json({ error: "조회 실패" });
  }
};

// 6. 내가 승인할 항목 목록 조회
exports.getPendingToMe = async (req, res) => {
  const userId = req.user.id;
  const { target_type } = req.query;

  let sql = `
    SELECT a.*, u.name AS requester_name
    FROM approvals a
    JOIN users u ON a.requester_id = u.id
    WHERE a.approver_id = ? AND a.status = 'PENDING'
  `;
  const params = [userId];

  if (target_type) {
    sql += ` AND LOWER(target_type) = ?`;
    params.push(target_type.toLowerCase());
  }
  sql += ` ORDER BY created_at ASC`;

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
          createdAt: row.created_at,
          dueDate: row.due_date,
          data,
        };
      })
    );
    res.json(enriched);
  } catch (err) {
    console.error("❌ 승인 목록 조회 실패:", err);
    res.status(500).json({ error: "조회 실패" });
  }
};

// 7. 결재자 직급 정보 조회
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
      logSystemAction(req, req.user, LOG_ACTIONS.READ_FAIL, "결재자 정보 없음");
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
    console.error("❌ 승인자 부서/직급 조회 실패:", err);
    res.status(500).json({ error: "결재자 정보 조회 실패" });
  }
};
// 8. 상세 보기 API
exports.getApprovalDetail = async (req, res) => {
  const { targetType, targetId } = req.params;
  try {
    let data = null;

    if (targetType === "vacation") {
      // 휴가 상세 정보 조회 (snapshot 값 포함)
      data = await dbGet(
        `SELECT v.start_date, v.end_date, v.type_code, v.reason, v.note, v.created_at,
                v.snapshot_name, v.snapshot_department_code, v.snapshot_position_code, u.employee_number
         FROM vacations v
         LEFT JOIN users u ON v.user_id = u.id
         WHERE v.id = ?`,
        [targetId]
      );

      if (data) {
        // 승인자 목록 조회 (승인 테이블 + 사용자 정보 + 직책 라벨)
        const approverRows = await dbAll(
          `SELECT a.step, u.name, u.position_code, cc.label AS position_label
           FROM approvals a
           JOIN users u ON a.approver_id = u.id
           LEFT JOIN common_codes cc ON cc.code_group = 'POSITION' AND cc.code = u.position_code
           WHERE a.target_type = 'vacation' AND a.target_id = ?
           ORDER BY a.step ASC`,
          [targetId]
        );

        // approvers 구조 생성: 직책에 따라 역할 필드 지정
        const approvers = {};
        for (const row of approverRows) {
          switch (row.position_code) {
            case "DEPHEAD": // 파트장
              approvers.partLead = `${row.position_label} ${row.name}`;
              break;
            case "LEAD": // 팀장
              approvers.teamLead = `${row.position_label} ${row.name}`;
              break;
            case "DIR": // 부장
            case "EVP": // 상무
              approvers.deptHead = `${row.position_label} ${row.name}`;
              break;
            case "CEO": // 대표
              approvers.ceo = `${row.position_label} ${row.name}`;
              break;
            default:
              // 그 외 직책은 manager로 간주 (최초 1회만 할당)
              if (!approvers.manager) {
                approvers.manager = `${row.position_label} ${row.name}`;
              }
          }
        }

        // 데이터에 approvers 필드 포함
        data.approvers = approvers;
      }
    } else if (targetType === "kpi") {
      // KPI 문서 상세
      data = await dbGet(`SELECT goal_title, period FROM kpis WHERE id = ?`, [
        targetId,
      ]);
    }

    // 데이터가 없으면 404 반환
    if (!data) {
      logSystemAction(req, req.user, LOG_ACTIONS.READ_FAIL, "상세 데이터 없음");
      return res.status(404).json({ error: "상세 데이터 없음" });
    }

    // 최종 응답
    res.json({
      id: Number(targetId),
      targetType,
      targetId: Number(targetId),
      data,
    });
  } catch (err) {
    console.error("❌ 상세 조회 실패:", err);
    res.status(500).json({ error: "상세 조회 실패" });
  }
};
