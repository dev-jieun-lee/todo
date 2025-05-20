const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

exports.logMenuAccess = (req, res) => {
  const { label, path } = req.body;
  const user = req.user || { id: null, username: "UNKNOWN" };

  if (!label || !path) {
    return res.status(400).json({ error: "label과 path는 필수입니다." });
  }

  logSystemAction(req, user, LOG_ACTIONS.MENU_ACCESS, `${label} (${path})`);
  res.status(200).json({ success: true });
};
