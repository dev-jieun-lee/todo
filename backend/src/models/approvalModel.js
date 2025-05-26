// models/approvalModel.js
const db = require("../config/db");

exports.insertApprovalStep = (data, callback) => {
  const {
    target_type,
    target_id,
    requester_id,
    approver_id,
    step,
    order_no = 1,
    is_final = 0,
  } = data;

  const sql = `
    INSERT INTO approvals (
      target_type, target_id, requester_id, approver_id,
      step, order_no, is_final
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(
    sql,
    [
      target_type,
      target_id,
      requester_id,
      approver_id,
      step,
      order_no,
      is_final,
    ],
    callback
  );
};

exports.getApprovalsByTarget = (targetType, targetId, callback) => {
  const sql = `
    SELECT * FROM approvals
    WHERE target_type = ? AND target_id = ?
    ORDER BY step ASC
  `;
  db.all(sql, [targetType, targetId], callback);
};
