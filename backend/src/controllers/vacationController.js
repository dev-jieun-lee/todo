const db = require("../config/db");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

exports.applyVacation = (req, res) => {
  const { type_code, start_date, end_date, reason } = req.body;
  const user = req.user;

  const sql = `
    INSERT INTO vacations (user_id, type_code, start_date, end_date, reason)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(
    sql,
    [user.id, type_code, start_date, end_date, reason || null],
    function (err) {
      if (err) return res.status(500).json({ error: "신청 실패" });

      logSystemAction(
        req,
        user,
        LOG_ACTIONS.VACATION_REQUEST,
        `${type_code} 신청 (${start_date}~${end_date})`
      );
      res.json({ success: true });
    }
  );
};

exports.getMyVacations = (req, res) => {
  const user = req.user;
  const sql = `
    SELECT id, type_code, start_date, end_date, status, reason, created_at
    FROM vacations
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;
  db.all(sql, [user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: "조회 실패" });
    res.json(rows);
  });
};
