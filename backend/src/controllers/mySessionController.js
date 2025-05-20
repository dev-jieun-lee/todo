const db = require("../config/db");
const { logEvent, logError } = require("../utils/handleError");

exports.getMySessions = (req, res) => {
  const userId = req.user.id;
  db.all(
    "SELECT * FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, rows) => {
      if (err) {
        logError("내 세션 목록 조회", err);
        return res.status(500).json({ error: "세션 조회 중 오류 발생" });
      }
      logEvent(`사용자(${userId}) 세션 목록 조회`);
      res.json(rows);
    }
  );
};
exports.deleteMySession = (req, res) => {
  const userId = req.user.id;
  const token = req.params.token;

  db.run(
    "DELETE FROM refresh_tokens WHERE token = ? AND user_id = ?",
    [token, userId],
    function (err) {
      if (err) {
        logError("내 세션 삭제", err);
        return res.status(500).json({ error: "세션 삭제 중 오류 발생" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "해당 세션이 존재하지 않음" });
      }

      logEvent(`사용자(${userId})가 세션 삭제: ${token}`);
      res.json({ message: "세션이 삭제되었습니다." });
    }
  );
};
exports.deleteAllExceptCurrent = (req, res) => {
  const userId = req.user.id;
  const currentToken = req.cookies.refreshToken;

  db.run(
    "DELETE FROM refresh_tokens WHERE user_id = ? AND token != ?",
    [userId, currentToken],
    function (err) {
      if (err) {
        logError("다른 세션 삭제", err);
        return res.status(500).json({ error: "다른 세션 삭제 중 오류 발생" });
      }

      logEvent(
        `사용자(${userId})가 현재 세션을 제외한 ${this.changes}개 세션 삭제`
      );
      res.json({ message: `${this.changes}개의 세션이 삭제되었습니다.` });
    }
  );
};
