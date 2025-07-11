require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { formatToKstString } = require("../utils/time");
const {
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllTokensByUserId,
} = require("../models/refreshTokenModel");
const { findUserByUsername } = require("../models/userModel");
const {
  handleDbError,
  logEvent,
  logWarning,
  logError,
  logSystemAction,
} = require("../utils/handleError");
const { LOG_ACTIONS, LOG_ACTION_LABELS } = require("../utils/logActions");

const SECRET_KEY = process.env.SECRET_KEY;

const login = (req, res) => {
  const { username, password } = req.body;

  try {
    findUserByUsername(username, async (err, user) => {
      console.log("🟦 [login] findUserByUsername 리턴 user:", user);
      if (err) {
        handleDbError(res, "로그인 - 사용자 조회", err);
        logSystemAction(
          req,
          null,
          LOG_ACTIONS.LOGIN_FAIL,
          `DB 오류 - ${username}`,
          "error"
        );
        return;
      }

      if (!user) {
        logWarning(`로그인 실패: 존재하지 않는 사용자 (${username})`);
        logSystemAction(
          req,
          null,
          LOG_ACTIONS.LOGIN_FAIL,
          LOG_ACTION_LABELS.LOGIN_FAIL,
          "error"
        );
        return res.status(401).json({ error: "존재하지 않는 사용자명입니다." });
      }

      bcrypt.compare(password, user.password, async (err, isMatch) => {
        if (err || !isMatch) {
          logWarning(`로그인 실패: 비밀번호 불일치 (${username})`);
          logSystemAction(
            req,
            null,
            LOG_ACTIONS.LOGIN_FAIL,
            LOG_ACTION_LABELS.LOGIN_FAIL,
            "error"
          );
          return res
            .status(401)
            .json({ error: "비밀번호가 일치하지 않습니다." });
        }

        const payload = {
          id: user.id,
          username: user.username,
          role: user.role,
        };
        const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "30m" });
        const refreshToken = jwt.sign(payload, SECRET_KEY, {
          expiresIn: "14d",
        });

        logSystemAction(
          req,
          user,
          LOG_ACTIONS.LOGIN,
          LOG_ACTION_LABELS.LOGIN,
          "info"
        );
        logEvent(`로그인 성공: ${username} (ID: ${user.id})`);

        const now = new Date();
        const expiresAtKST = formatToKstString(
          new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        );
        const createdAtKST = formatToKstString(now);

        try {
          await deleteAllTokensByUserId(user.id);
          logEvent(`기존 Refresh Token 삭제 완료 (ID: ${user.id})`);
        } catch (deleteErr) {
          logError("기존 Refresh Token 삭제 실패", deleteErr);
        }

        try {
          await saveRefreshToken(
            user.id,
            refreshToken,
            expiresAtKST,
            createdAtKST
          );
          logEvent(`Refresh Token 저장 완료 (ID: ${user.id})`);
        } catch (err2) {
          logError("Refresh Token 저장 실패", err2);
        }

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false, // 운영환경에서는 true 권장
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
            department_code: user.department_code,
            team_code: user.team_code,
            position_code: user.position_code,
            employee_number: user.employee_number,
            email: user.email,
          },
        });
      });
    });
  } catch (e) {
    logError("로그인 예외", e);
    logSystemAction(
      req,
      null,
      LOG_ACTIONS.LOGIN_FAIL,
      `서버 예외: ${e.message}`,
      "error"
    );
    return res
      .status(500)
      .json({ error: "알 수 없는 서버 오류가 발생했습니다." });
  }
};

const logout = (req, res) => {
  // 로그 기록: 받은 쿠키
  logSystemAction(
    req,
    req.user,
    LOG_ACTIONS.LOGOUT,
    `🧪 [서버] 받은 쿠키: ${JSON.stringify(req.cookies)}`,
    "info" // 쿠키 조회 시 정보 로그
  );

  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    deleteRefreshToken(refreshToken, (err) => {
      if (err) logError("토큰 삭제 실패", err);
      else logEvent("토큰 삭제 완료");
    });
    res.clearCookie("refreshToken");
  }

  // Access Token이 만료되어 req.user가 undefined일 수 있음
  const id = req.user?.id || null;
  const username = req.user?.username || "unknown";

  // 로그아웃 성공
  logSystemAction(
    req,
    req.user ?? null,
    LOG_ACTIONS.LOGOUT,
    LOG_ACTION_LABELS.LOGOUT,
    "info"
  );
  logEvent(`로그아웃 완료: ${username} (ID: ${id ?? "?"})`);

  return res.json({ message: "로그아웃 완료" });
};

const refresh = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ error: "Refresh Token 없음" });

  findRefreshToken(refreshToken, (err, row) => {
    if (err || !row)
      return res.status(403).json({ error: "Refresh Token 무효" });

    if (new Date(row.expires_at) < new Date()) {
      return res.status(403).json({ error: "Refresh Token 만료" });
    }

    jwt.verify(refreshToken, SECRET_KEY, (err, decoded) => {
      if (err) return res.status(403).json({ error: "토큰 검증 실패" });

      const { id, username, role } = decoded;
      const newAccessToken = jwt.sign({ id, username, role }, SECRET_KEY, {
        expiresIn: "15m",
      });

      // 토큰 갱신
      logSystemAction(
        req,
        { id, username },
        LOG_ACTIONS.TOKEN_REFRESH,
        LOG_ACTION_LABELS.TOKEN_REFRESH,
        "info"
      );
      return res.json({ token: newAccessToken });
    });
  });
};

module.exports = {
  login,
  logout,
  refresh,
};
