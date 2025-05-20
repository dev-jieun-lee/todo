require("dotenv").config();
const { findUserByUsername } = require("../models/userModel");
const { insertSystemLog } = require("../models/systemLogModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRET_KEY = process.env.SECRET_KEY;
const {
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
} = require("../models/refreshTokenModel");

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

      // bcrypt.compare로 비밀번호 검증
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

        // 로그인 성공
        const payload = {
          id: user.id,
          username: user.username,
          role: user.role,
        };
        const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, SECRET_KEY, {
          expiresIn: "14d",
        });

        insertSystemLog(
          user.id,
          username,
          "LOGIN",
          "로그인 성공",
          ip,
          userAgent
        );

        // Refresh Token을 db에 저장
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        saveRefreshToken(
          user.id,
          refreshToken,
          expiresAt.toISOString(),
          (err) => {
            if (err) console.error("❌ Refresh Token 저장 실패");
          }
        );
        // Refresh Token을 HttpOnly 쿠키로 저장
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false, // 내부망이라면 false, HTTPS면 true
          sameSite: "strict",
          maxAge: 14 * 24 * 60 * 60 * 1000,
        });

        return res.json({
          token: accessToken,
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
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    deleteRefreshToken(refreshToken, (err) => {
      if (err) console.error("❌ 토큰 삭제 실패:", err.message);
      else console.log("✅ 토큰 삭제 완료");
    });
    res.clearCookie("refreshToken");
  }

  const { id, username } = req.user;
  const ip = req.headers["x-forwarded-for"] || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  insertSystemLog(id, username, "LOGOUT", "로그아웃", ip, userAgent);

  return res.json({ message: "로그아웃 완료" });
};

const refresh = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ error: "Refresh Token 없음" });

  // DB에서 토큰 존재 여부 확인
  findRefreshToken(refreshToken, (err, row) => {
    if (err || !row) {
      return res.status(403).json({ error: "Refresh Token 무효" });
    }

    // 만료 확인
    const now = new Date();
    if (new Date(row.expires_at) < now) {
      return res.status(403).json({ error: "Refresh Token 만료" });
    }

    // JWT 검증
    jwt.verify(refreshToken, SECRET_KEY, (err, decoded) => {
      if (err) return res.status(403).json({ error: "토큰 검증 실패" });

      const { id, username, role } = decoded;
      const newAccessToken = jwt.sign({ id, username, role }, SECRET_KEY, {
        expiresIn: "15m",
      });

      return res.json({ token: newAccessToken });
    });
  });
};

module.exports = {
  login,
  logout,
  refresh,
};
