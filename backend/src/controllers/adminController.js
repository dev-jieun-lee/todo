// controllers/sessionController.js
const { dbAll } = require("../utils/dbHelpers");
const { deleteAllTokensByUserId } = require("../models/refreshTokenModel");
const { findUserById, findAllUsers } = require("../models/userModel");
const {
  logError,
  logEvent,
  logWarning,
  logSystemAction,
  handleDbError,
} = require("../utils/handleError");
const { LOG_ACTIONS, LOG_ACTION_LABELS } = require("../utils/logActions");

// 강제 로그아웃 함수
exports.forceLogout = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    logWarning("강제 로그아웃 시도 - user_id 누락");
    return res.status(400).json({ error: "user_id 누락" });
  }

  try {
    await deleteAllTokensByUserId(user_id);

    const adminUser = {
      id: req.user?.id || null,
      username: req.user?.username || "admin",
    };

    logSystemAction(
      req,
      adminUser,
      LOG_ACTIONS.FORCE_LOGOUT,
      `${LOG_ACTION_LABELS.FORCE_LOGOUT}: 대상 사용자 ID ${user_id}`,
      "info"
    );
    findUserById(user_id, (err, user) => {
      if (err || !user) {
        logWarning(`강제 로그아웃 대상 사용자(${user_id})가 존재하지 않음`);
      } else {
        logEvent(
          `관리자(${adminUser.username})가 사용자(${user.name}) 세션을 강제 종료`
        );
      }
    });

    return res.json({
      message: "해당 사용자의 모든 세션이 강제 로그아웃되었습니다.",
    });
  } catch (err) {
    logError("강제 로그아웃 실패", err);
    return res.status(500).json({ error: "강제 로그아웃 실패" });
  }
};

// 전체 사용자 세션 조회 함수
exports.getActiveSessions = (req, res) => {
  findAllUsers(async (err, users) => {
    if (err) return handleDbError(res, "세션 사용자 조회", err);

    try {
      const results = await Promise.all(
        users.map(async (user) => {
          try {
            const tokens = await dbAll(
              "SELECT * FROM refresh_tokens WHERE user_id = ?",
              [user.id]
            );
            return { user, tokens };
          } catch (tokenErr) {
            logError("세션 토큰 조회 실패", tokenErr);
            return { user, tokens: [] };
          }
        })
      );
      res.json(results);
    } catch (err2) {
      logError("세션 전체 조회 실패", err2);
      return res.status(500).json({ error: "세션 전체 조회 실패" });
    }
  });
};
