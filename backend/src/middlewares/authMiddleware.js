const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    console.warn("🚫 인증 실패: 토큰 없음");
    return res.status(401).json({ error: "토큰이 없습니다." });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error("❌ JWT 검증 실패:", err.message);
      return res.status(403).json({ error: "유효하지 않은 토큰입니다." });
    }

    //console.log(`✅ JWT 검증 통과 - 사용자: ${user.username}`);
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
