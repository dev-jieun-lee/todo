const History = require("../models/todoHistoryModel");
const {
  handleDbError,
  logWarning,
  logSystemAction,
} = require("../utils/handleError");
const { LOG_ACTIONS, LOG_ACTION_LABELS } = require("../utils/logActions");

exports.getAllByUser = (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    logWarning("히스토리 조회 실패 - user_id 누락");
    return res.status(400).json({ error: "user_id is required" });
  }

  History.getAllByUser(userId, (err, rows) => {
    if (err) return handleDbError(res, "히스토리 조회", err);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.HISTORY_VIEW,
      `${LOG_ACTION_LABELS.HISTORY_VIEW}: 대상 사용자 ID ${userId}`
    );

    res.json(rows);
  });
};
