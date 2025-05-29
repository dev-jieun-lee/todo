const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

exports.logMenuAccess = async (req, res) => {
  const { label, path } = req.body;
  const user = req.user ?? { id: null, username: "UNKNOWN" };

  if (!label || !path) {
    logSystemAction(
      req,
      user,
      LOG_ACTIONS.MENU_ACCESS_FAIL,
      "label 또는 path 누락",
      "error"
    );

    return res.status(400).json({ error: "label과 path는 필수입니다." });
  }

  try {
    // 정상적인 메뉴 접근 기록
    logSystemAction(
      req,
      user,
      LOG_ACTIONS.MENU_ACCESS,
      `${label} (${path})`,
      "info"
    );
    res.status(200).json({ success: true });
  } catch (err) {
    // 예외 발생 시
    logSystemAction(
      req,
      user,
      LOG_ACTIONS.MENU_ACCESS_FAIL,
      `예외 발생: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "메뉴 접근 기록 실패" });
  }
};
