require("dotenv").config();
const { findUserByUsername } = require("../models/userModel");
const { insertSystemLog } = require("../models/systemLogModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt"); // ✅ bcrypt 추가

const SECRET_KEY = process.env.SECRET_KEY;

const login = (req, res) => {
  const { username, password } = req.body;

  const ip =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  try {
    findUserByUsername(username, (err, user) => {
      if (err) {
        console.error("❌ DB 오류:", err);
        insertSystemLog(
          null,
          username,
          "LOGIN_FAIL",
          `DB 오류 - ${username}`,
          ip,
          userAgent
        );
        return res
          .status(500)
          .json({ error: "서버 내부 오류: 사용자 조회 실패" });
      }

      if (!user) {
        const detail = `존재하지 않는 사용자명`;
        console.warn(`⚠️ 로그인 실패: ${detail} (${username})`);
        insertSystemLog(null, username, "LOGIN_FAIL", detail, ip, userAgent);
        return res.status(401).json({ error: "존재하지 않는 사용자명입니다." });
      }

      // ✅ bcrypt.compare로 비밀번호 검증
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err || !isMatch) {
          const detail = `비밀번호 불일치`;
          console.warn(`⚠️ 로그인 실패: ${detail} (${username})`);
          insertSystemLog(
            user.id,
            username,
            "LOGIN_FAIL",
            detail,
            ip,
            userAgent
          );
          return res
            .status(401)
            .json({ error: "비밀번호가 일치하지 않습니다." });
        }

        // ✅ 로그인 성공
        const payload = {
          id: user.id,
          username: user.username,
          role: user.role,
        };

        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "2h" });
        insertSystemLog(
          user.id,
          username,
          "LOGIN",
          "로그인 성공",
          ip,
          userAgent
        );

        return res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
          },
        });
      });
    });
  } catch (e) {
    console.error("❌ 예기치 않은 서버 오류:", e);
    insertSystemLog(
      null,
      username,
      "LOGIN_FAIL",
      `서버 예외: ${e.message}`,
      ip,
      userAgent
    );
    return res
      .status(500)
      .json({ error: "알 수 없는 서버 오류가 발생했습니다." });
  }
};

const logout = (req, res) => {
  const { id, username } = req.user;
  const ip = req.headers["x-forwarded-for"] || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  insertSystemLog(id, username, "LOGOUT", "로그아웃", ip, userAgent);

  return res.json({ message: "로그아웃 완료" });
};

module.exports = { login, logout };
