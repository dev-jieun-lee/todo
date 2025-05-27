// controllers/approvalController.js
//승인/반려 처리, 승인 이력, 대기 목록 등 전자결재 처리	승인자 (팀장, 부장 등)
const db = require("../config/db");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const dbGet = (sql, params) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error("❌ dbGet 쿼리 에러:", sql, params, err);
        reject(err);
      } else {
        if (!row) {
          console.warn("⚠️ dbGet 결과 없음:", params);
        }
        resolve(row);
      }
    });
  });

const dbAll = (sql, params) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    })
  );

// 1. 승인 처리
exports.approve = (req, res) => {
  const { targetType, targetId } = req.params;
  const userId = req.user.id;

  console.log("🟢 승인 요청 시작:", { userId, targetType, targetId });

  const checkSql = `
    SELECT id, status, is_final, step
    FROM approvals
    WHERE LOWER(target_type) = LOWER(?) AND target_id = ? AND approver_id = ?
  `;
  db.get(checkSql, [targetType, targetId, userId], (err, row) => {
    if (err) return res.status(500).json({ error: "사전 상태 확인 실패" });
    if (!row) return res.status(403).json({ error: "승인 권한 없음" });
    if (row.status !== "PENDING")
      return res.status(400).json({ error: `이미 처리됨 (${row.status})` });

    const approvalId = row.id;
    const step = row.step;

    const updateApprovalSql = `
      UPDATE approvals
      SET status = 'APPROVED', approved_at = datetime('now')
      WHERE id = ?
    `;
    db.run(updateApprovalSql, [approvalId], function (err2) {
      if (err2) {
        console.error("❌ approvals 테이블 업데이트 실패", err2);
        return res.status(500).json({ error: "승인 실패" });
      }
      console.log("✅ approvals 상태 업데이트 완료:", approvalId);

      // approval_history 기록
      const insertApprovalHistory = `
        INSERT INTO approval_history
        (approval_id, target_type, target_id, step, action, memo, actor_id, prev_status, new_status)
        VALUES (?, ?, ?, ?, 'APPROVE', '', ?, 'PENDING', 'APPROVED')
      `;
      db.run(
        insertApprovalHistory,
        [approvalId, targetType, targetId, step, userId],
        function (err3) {
          if (err3) console.error("❌ approval_history 기록 실패", err3);
          else console.log("📘 approval_history 기록 완료:", this.lastID);
        }
      );

      // 최종 승인일 경우 vacations 업데이트
      if (row.is_final === 1 && targetType.toLowerCase() === "vacation") {
        const selectVacationSql = `SELECT status, user_id FROM vacations WHERE id = ?`;
        db.get(selectVacationSql, [targetId], (err4, vacationRow) => {
          if (err4 || !vacationRow) {
            console.warn("❗ vacation 레코드 없음");
            return res.json({ success: true, warning: "vacation 상태 미갱신" });
          }

          const { status: oldStatus, user_id } = vacationRow;

          // 1. vacations 테이블 업데이트
          const updateVacationSql = `
            UPDATE vacations
            SET status = 'APPROVED', approved_by = ?, approved_at = datetime('now')
            WHERE id = ?
          `;
          db.run(updateVacationSql, [userId, targetId], function (err5) {
            if (err5) console.error("❌ vacations 상태 업데이트 실패", err5);
            else console.log("✅ vacations 상태 업데이트 완료:", targetId);
          });

          // 2. vacation_history INSERT
          const insertVacationHistory = `
            INSERT INTO vacation_history
            (vacation_id, user_id, action, old_value, new_value, memo, admin_id)
            VALUES (?, ?, 'APPROVE', ?, 'APPROVED', '최종 승인', ?)
          `;
          db.run(
            insertVacationHistory,
            [targetId, user_id, oldStatus, userId],
            function (err6) {
              if (err6) console.error("❌ vacation_history 기록 실패", err6);
              else console.log("📘 vacation_history 기록 완료:", this.lastID);
            }
          );
        });
      } else {
        console.log(
          "ℹ️ 최종 승인 아님 → vacation 상태/이력 변경 생략 (is_final:",
          row.is_final,
          ")"
        );
      }
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.APPROVE,
        `${targetType} ${targetId} 승인`
      );

      res.json({ success: true });
    });
  });
};

// 2. 반려 처리
exports.reject = (req, res) => {
  const { targetType, targetId } = req.params;
  const userId = req.user.id;
  const { memo = "반려 처리" } = req.body;

  const checkSql = `SELECT status FROM approvals WHERE target_type = ? AND target_id = ? AND approver_id = ?`;
  db.get(checkSql, [targetType, targetId, userId], (err, row) => {
    if (err) return res.status(500).json({ error: "사전 상태 확인 실패" });
    console.log("🔍 반려자 확인 결과:", row);
    if (!row) return res.status(403).json({ error: "반려 권한 없음" });
    if (row.status !== "PENDING")
      return res.status(400).json({ error: `이미 처리됨 (${row.status})` });

    const updateSql = `UPDATE approvals SET status = 'REJECTED', memo = ?, approved_at = datetime('now') WHERE target_type = ? AND target_id = ? AND approver_id = ?`;
    db.run(updateSql, [memo, targetType, targetId, userId], function (err2) {
      if (err2) return res.status(500).json({ error: "반려 실패" });

      let updateTargetSql = null;
      if (targetType === "vacation")
        updateTargetSql = `UPDATE vacations SET status = 'REJECTED' WHERE id = ?`;
      if (targetType === "kpi")
        updateTargetSql = `UPDATE kpis SET status = 'REJECTED' WHERE id = ?`;
      if (updateTargetSql) db.run(updateTargetSql, [targetId]);

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
    });
  });
};

// 4. 승인 이력 조회
exports.getApprovalHistory = (req, res) => {
  const { targetType, targetId } = req.params;
  const sql = `SELECT a.*, u.name AS approver_name FROM approvals a JOIN users u ON a.approver_id = u.id WHERE target_type = ? AND target_id = ? ORDER BY step ASC, approved_at ASC`;
  db.all(sql, [targetType, targetId], (err, rows) => {
    if (err) return res.status(500).json({ error: "이력 조회 실패" });
    res.json(rows);
  });
};

// 내가 요청한 승인 목록 조회 (by requester_id)
exports.getRequestedApprovals = async (req, res) => {
  console.log(
    "내가 요청한 승인 목록 조회 (by requester_id), req.user.id:",
    req.user.id
  );
  console.log(
    "내가 요청한 승인 목록 조회 (by requester_id), req.query: ",
    req.query
  );
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
    console.log("✅ approvals 조회 결과 개수:", rows.length);
    const enrichedRows = await Promise.all(
      rows.map(async (row) => {
        let data = null;

        if ((row.target_type || "").toLowerCase() === "vacation") {
          data = await dbGet(
            `SELECT start_date, end_date, type_code AS type_label FROM vacations WHERE id = ?`,
            [row.target_id]
          );
          console.log(
            "🧾 getRequestedApprovals vacation 조회결과:",
            row.target_id,
            data
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

  // db.all을 Promise로 래핑
  const getApprovals = () =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

  try {
    const rows = await getApprovals();

    const enriched = await Promise.all(
      rows.map(async (row) => {
        let data = null;

        if (row.target_type === "vacation") {
          data = await dbGet(
            `SELECT start_date, end_date, type_code AS type_label FROM vacations WHERE id = ?`,
            [row.target_id]
          );
          console.log(
            "🧾 getPendingtoMe vacation 조회결과:",
            row.target_id,
            data
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

    console.log("📤 [getPendingToMe] enriched 응답:", enriched);
    res.json(enriched);
  } catch (err) {
    console.error("❌ 승인 목록 조회 실패:", err);
    res.status(500).json({ error: "조회 실패" });
  }
};

// 결재자 직급 정보 조회
exports.getPositionLabel = (req, res) => {
  const targetId = req.params.targetId;

  const sql = `
    SELECT
      dept.label AS department_label,
      pos.label AS position_label
    FROM approvals a
    JOIN users u ON a.approver_id = u.id
    LEFT JOIN common_codes dept ON u.department_code = dept.code
    LEFT JOIN common_codes pos ON u.position_code = pos.code
    WHERE a.target_id = ?
    LIMIT 1
  `;

  db.get(sql, [targetId], (err, row) => {
    if (err) {
      console.error("❌ 승인자 부서/직급 조회 실패:", err);
      return res.status(500).json({ error: "결재자 정보 조회 실패" });
    }
    if (!row) {
      console.warn("⚠️ 결재자 정보 없음:", targetId);
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
  });
};

// 상세 보기 API
exports.getApprovalDetail = async (req, res) => {
  const { targetType, targetId } = req.params;

  try {
    let data = null;

    if (targetType === "vacation") {
      // 1. 기본 휴가 정보 + snapshot + employee_number 조인
      data = await dbGet(
        `SELECT
          v.start_date,
          v.end_date,
          v.type_code,
          v.reason,
          v.note,
          v.created_at,
          v.snapshot_name,
          v.snapshot_department_code,
          v.snapshot_position_code,
          u.employee_number
        FROM vacations v
        LEFT JOIN users u ON v.user_id = u.id
        WHERE v.id = ?`,
        [targetId]
      );

      if (data) {
        // 2. LEADER 역할만 승인자로 조회
        const approverRows = await dbAll(
          `SELECT a.step, u.name, u.role
           FROM approvals a
           JOIN users u ON a.approver_id = u.id
           WHERE a.target_type = 'vacation'
             AND a.target_id = ?
             AND u.role = 'LEADER'`,
          [targetId]
        );

        const approvers = {
          teamLead: null,
          deptHead: null,
        };

        for (const row of approverRows) {
          if (row.step === 1) approvers.teamLead = row.name;
          else if (row.step === 2) approvers.deptHead = row.name;
        }

        data.approvers = approvers;
      }
    }

    // 예: KPI, TODO 등 다른 유형
    else if (targetType === "kpi") {
      data = await dbGet(`SELECT goal_title, period FROM kpis WHERE id = ?`, [
        targetId,
      ]);
    }

    if (!data) {
      console.warn("⚠️ 상세 데이터 없음:", targetType, targetId);
      return res.status(404).json({ error: "상세 데이터 없음" });
    }

    console.log("📄 상세 데이터 조회 결과:", data);

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
