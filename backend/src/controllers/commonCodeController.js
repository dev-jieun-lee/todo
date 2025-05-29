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
      "공통코드 조회 실패 - group 누락",
      "error"
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
      req.user,
      LOG_ACTIONS.CODE_LOOKUP,
      `공통코드 조회 - 그룹: ${group}`,
      "info"
    );

    res.json(rows);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      "CODE_LOOKUP",
      `공통코드 조회 - 그룹: ${group}`,
      "info"
    );

    res.status(500).json({ error: "공통코드 조회 실패" });
  }
};
