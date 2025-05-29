const jwt = require("jsonwebtoken");
require("dotenv").config();
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS, LOG_ACTION_LABELS } = require("../utils/logActions");

const SECRET_KEY = process.env.SECRET_KEY;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    console.warn("🚫 인증 실패: 토큰 없음");
    return res.status(401).json({ error: "토큰이 없습니다." });
  }
  console.log("🚀 토큰 검증 시작: ", token); // 디버깅 - 토큰이 올바르게 전달되었는지 확인

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      logSystemAction(
        req,
        null, // 로그인 시 사용자가 없을 수 있기 때문에 null로 설정
        LOG_ACTIONS.LOGIN_FAIL,
        `JWT 검증 실패: ${err.message}`,
        "error"
      );
      return res.status(403).json({ error: "유효하지 않은 토큰입니다." });
    }
    console.log("✅ JWT 검증 통과 - 사용자: ", user);
    logSystemAction(
      req,
      user,
      LOG_ACTIONS.LOGIN,
      `JWT 검증 통과 - 사용자: ${user.username}`,
      "info"
    );
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
