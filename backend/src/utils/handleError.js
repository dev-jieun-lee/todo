const fs = require("fs");
const path = require("path");
const { insertSystemLog } = require("../models/systemLogModel");

const LOG_DIR = path.join(__dirname, "../logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const writeLog = (filename, message) => {
  const logPath = path.join(LOG_DIR, filename);
  const entry = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFile(logPath, entry, (err) => {
    if (err) console.error(`❗ ${filename} 기록 실패:`, err.message);
  });
};

// DB 오류 응답 + 에러 로그 기록
const handleDbError = (res, context, err, status = 500) => {
  const message = `❌ [${context}] DB 오류: ${err.message}`;
  console.error(message);
  writeLog("errors.log", message);
  return res.status(status).json({ error: `${context} 중 오류 발생` });
};

// 일반 에러 기록
const logError = (context, err) => {
  const message = `❌ [${context}] ${err.message}`;
  console.error(message);
  writeLog("errors.log", message);
};

// 경고 기록
const logWarning = (message) => {
  const full = `⚠️ ${message}`;
  console.warn(full);
  writeLog("warn.log", full);
};

// 일반 이벤트 기록
const logEvent = (message) => {
  const full = `📋 ${message}`;
  console.log(full);
  writeLog("events.log", full);
};

// 시스템 로그 기록 (DB + 파일)
// user는 { id, username } 객체 또는 null
const logSystemAction = (req, user, action, detail) => {
  const ip = req.headers["x-forwarded-for"] || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  const user_id = user?.id || null;
  const username = user?.username || "UNKNOWN";

  const logMsg = `📝 [${action}] ${username} - ${detail}`;
  console.log(logMsg);

  // 시스템 로그 DB 기록
  insertSystemLog(user_id, username, action, detail, ip, userAgent);

  // 선택적으로 파일 기록도 함께
  writeLog("system.log", logMsg);
};

module.exports = {
  handleDbError,
  logError,
  logWarning,
  logEvent,
  logSystemAction,
};
