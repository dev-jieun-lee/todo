const { dbAll } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

exports.getCodesByGroup = async (req, res) => {
  const { group } = req.query;

  if (!group) {
    logSystemAction(
      req,
      null,
      LOG_ACTIONS.CODE_LOOKUP_FAIL,
      "공통코드 조회 실패 - group 누락"
    );
    return res.status(400).json({ error: "code_group is required" });
  }

  try {
    const rows = await dbAll(
      `SELECT code, label FROM common_codes WHERE code_group = ? AND active = 1 ORDER BY sort_order ASC`,
      [group]
    );

    logSystemAction(
      req,
      req.user ?? null,
      LOG_ACTIONS.CODE_LOOKUP,
      `공통코드 조회 - 그룹: ${group}`
    );
    res.json(rows);
  } catch (err) {
    console.error("공통코드 조회 실패:", err);
    logSystemAction(
      req,
      req.user ?? null,
      LOG_ACTIONS.CODE_LOOKUP_FAIL,
      `공통코드 조회 예외: ${err.message}`
    );
    res.status(500).json({ error: "공통코드 조회 실패" });
  }
};
