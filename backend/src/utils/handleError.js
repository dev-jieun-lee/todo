const fs = require("fs");
const path = require("path");
const { insertSystemLog } = require("../models/systemLogModel");

const LOG_DIR = path.join(__dirname, "../logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// 로그 파일 자동 선택
const getLogFile = (level) => {
  switch (level) {
    case "error":
      return "errors.log";
    case "warn":
      return "warn.log";
    case "event":
      return "events.log";
    case "system":
      return "system.log";
    default:
      return "app.log";
  }
};

// 공통 로그 기록 함수
const writeLog = (level, message) => {
  const filename = getLogFile(level);
  const logPath = path.join(LOG_DIR, filename);
  const entry = `[${new Date().toISOString()}] ${message}\n`;

  fs.appendFile(logPath, entry, (err) => {
    if (err) console.error(`❗ ${filename} 기록 실패:`, err.message);
  });
};

// DB 오류 발생 시 응답 + 로그
const handleDbError = (res, context, err, status = 500) => {
  const message = `❌ [${context}] DB 오류: ${err.message}`;
  console.error(message);
  writeLog("error", message);
  return res.status(status).json({ error: `${context} 중 오류 발생` });
};

// 일반 에러
const logError = (context, err) => {
  const message = `❌ [${context}] ${err.message}`;
  console.error(message);
  writeLog("error", message);
};

// 경고
const logWarning = (message) => {
  const full = `⚠️ ${message}`;
  console.warn(full);
  writeLog("warn", full);
};

// 이벤트 로그
const logEvent = (message) => {
  const full = `📋 ${message}`;
  console.log(full);
  writeLog("event", full);
};

// 시스템 액션 로그 (DB + 파일)
const logSystemAction = (req, user, action, detail) => {
  const ip = req.headers["x-forwarded-for"] || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  const user_id = user?.id || null;
  const username = user?.username || "UNKNOWN";

  const logMsg = `[${action}] - 사용자: ${username} - ${detail}`;
  console.log(logMsg);

  insertSystemLog(user_id, username, action, detail, ip, userAgent);
  writeLog("system", logMsg);
};

module.exports = {
  handleDbError,
  logError,
  logWarning,
  logEvent,
  logSystemAction,
};
