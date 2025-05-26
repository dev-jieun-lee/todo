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

  const checkSql = `SELECT status, is_final FROM approvals WHERE target_type = ? AND target_id = ? AND approver_id = ?`;
  db.get(checkSql, [targetType, targetId, userId], (err, row) => {
    if (err) return res.status(500).json({ error: "사전 상태 확인 실패" });
    if (!row) return res.status(403).json({ error: "승인 권한 없음" });
    if (row.status !== "PENDING")
      return res.status(400).json({ error: `이미 처리됨 (${row.status})` });

    const updateSql = `UPDATE approvals SET status = 'APPROVED', approved_at = datetime('now') WHERE target_type = ? AND target_id = ? AND approver_id = ?`;
    db.run(updateSql, [targetType, targetId, userId], function (err2) {
      if (err2) return res.status(500).json({ error: "승인 실패" });

      // 최종 승인일 경우 실제 항목 상태도 변경
      if (row.is_final === 1) {
        let updateTargetSql = null;
        if (targetType === "vacation")
          updateTargetSql = `UPDATE vacations SET status = 'APPROVED' WHERE id = ?`;
        if (targetType === "kpi")
          updateTargetSql = `UPDATE kpis SET status = 'APPROVED' WHERE id = ?`;
        if (updateTargetSql) db.run(updateTargetSql, [targetId]);
      }

      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.APPROVE,
        `${targetType} ${targetId} 승인`
      );
      console.log("📤 [approve] 승인 완료 응답:", {
        targetType,
        targetId,
        userId,
      });
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
