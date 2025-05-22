const db = require("../config/db");

exports.getCodesByGroup = (req, res) => {
  const { group } = req.query;
  if (!group) return res.status(400).json({ error: "code_group is required" });

  const sql = `
    SELECT code, label
    FROM common_codes
    WHERE code_group = ? AND active = 1
    ORDER BY sort_order ASC
  `;

  db.all(sql, [group], (err, rows) => {
    if (err) {
      console.error("공통코드 조회 실패:", err);
      return res.status(500).json({ error: "공통코드 조회 실패" });
    }
    res.json(rows);
  });
};
