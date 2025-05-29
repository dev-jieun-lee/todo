const { dbAll } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS, LOG_ACTION_LABELS } = require("../utils/logActions");

exports.getAllByUser = async (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.HISTORY_VIEW_FAIL,
      "히스토리 조회 실패 - user_id 누락",
      "error"
    );
    return res.status(400).json({ error: "user_id is required" });
  }
  try {
    const rows = await dbAll(
      "SELECT * FROM todo_history WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.HISTORY_VIEW,
      `${LOG_ACTION_LABELS.HISTORY_VIEW}: 대상 사용자 ID ${userId}`,
      "info"
    );
    res.json(rows);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.HISTORY_VIEW_FAIL,
      `예외 발생: ${err.message}`,
      "error"
    );
    return res.status(500).json({ error: "히스토리 조회 실패" });
  }
};
