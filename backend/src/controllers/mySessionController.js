const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");
const {
  handleDbError,
  logEvent,
  logWarning,
  logError,
  logSystemAction,
} = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

exports.getMySessions = async (req, res) => {
  const userId = req.user.id;

  try {
    const sessions = await dbAll(
      "SELECT token, expires_at, created_at FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    res.json(sessions);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.ERROR,
      `세션 목록 조회 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "세션 목록을 불러오지 못했습니다." });
  }
};

exports.deleteMySession = async (req, res) => {
  const userId = req.user.id;
  const token = req.params.token;

  try {
    const result = await dbRun(
      "DELETE FROM refresh_tokens WHERE token = ? AND user_id = ?",
      [token, userId]
    );

    if (result.changes === 0) {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.SESSION_DELETE_FAIL,
        `삭제 실패: 세션 없음 (토큰: ${token})`,
        "warn"
      );
      return res.status(404).json({ error: "해당 세션이 존재하지 않음" });
    }

    logEvent(`사용자(${userId})가 세션 삭제: ${token}`);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.SESSION_DELETE,
      `세션 삭제: ${token}`,
      "info"
    );

    res.json({ message: "세션이 삭제되었습니다." });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.SESSION_DELETE_FAIL,
      `예외 발생: ${err.message}`,
      "error"
    );
    return res.status(500).json({ error: "세션 삭제 중 오류 발생" });
  }
};

exports.deleteAllExceptCurrent = async (req, res) => {
  const userId = req.user.id;
  const currentToken = req.cookies.refreshToken;

  try {
    const result = await dbRun(
      "DELETE FROM refresh_tokens WHERE user_id = ? AND token != ?",
      [userId, currentToken]
    );

    logEvent(`사용자(${userId})가 현재 세션 제외 ${result.changes}개 삭제`);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.SESSION_DELETE_OTHERS,
      `현재 세션 제외 ${result.changes}개 삭제`,
      "info"
    );

    res.json({ message: `${result.changes}개의 세션이 삭제되었습니다.` });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.SESSION_DELETE_OTHERS_FAIL,
      `예외 발생: ${err.message}`,
      "error"
    );
    return res.status(500).json({ error: "다른 세션 삭제 중 오류 발생" });
  }
};
