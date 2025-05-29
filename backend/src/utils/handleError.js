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

// 로그 기록 (파일)
const writeLog = (level, message) => {
  const validLevels = ["error", "warn", "event", "system"];
  const logFile = validLevels.includes(level)
    ? getLogFile(level)
    : getLogFile("app");
  const logPath = path.join(LOG_DIR, logFile);
  const entry = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFile(logPath, entry, (err) => {
    if (err) console.error(`❗ ${logFile} 기록 실패:`, err.message);
  });
};

//공통 로그 출력 + 파일 기록
const logWithLevel = (level, message) => {
  const full = `[${new Date().toISOString()}] ${message}`;
  switch (level) {
    case "error":
      console.error(full);
      break;
    case "warn":
      console.warn(full);
      break;
    case "event":
    case "info":
    default:
      console.log(full);
  }
  writeLog(level, message);
};

// DB 오류 발생 시 응답 + 로그
const handleDbError = (res, context, err, status = 500) => {
  const message = `❌ [${context}] DB 오류: ${err.message}`;
  logWithLevel("error", message);
  return res.status(status).json({ error: `${context} 중 오류 발생` });
};

// 일반 에러
const logError = (context, err) =>
  logWithLevel("error", `❌ [${context}] ${err.message}`);

// 경고
const logWarning = (msg) => logWithLevel("warn", `⚠️ ${msg}`);

// 이벤트 로그
const logEvent = (msg) => logWithLevel("event", `📋 ${msg}`);

// 시스템 액션 로그 (DB + 파일)
// level: "info" | "warn" | "error" 등 명시 권장
const logSystemAction = (req, user, action, detail = "", level = "info") => {
  console.log("logSystemAction 호출 - action:", action); // 디버깅용 로그 추가

  if (!action || action === "undefined") {
    console.warn("⚠️ logSystemAction() 호출 시 action 누락됨");
  }
  if (!detail || detail === "undefined") {
    console.warn("⚠️ logSystemAction() 호출 시 detail 누락됨");
  }

  // req가 없을 경우 기본값 설정
  const ip = req?.headers["x-forwarded-for"] || req?.ip || "unknown_ip";
  const userAgent = req?.headers["user-agent"] || "unknown_user_agent";

  const user_id = user?.id || null;
  const username = user?.username || "UNKNOWN";

  const logMsg = `[${action}] - 사용자: ${username} - ${detail}`;
  logWithLevel(level, logMsg);

  // insertSystemLog 호출 (DB에 기록)
  insertSystemLog(user_id, username, action, detail, ip, userAgent);
};

module.exports = {
  handleDbError,
  logError,
  logWarning,
  logEvent,
  logSystemAction,
  logWithLevel, // 원하면 외부에서 직접 사용도 가능
};

// 향후 로그 레벨에 따라 슬랙 알림/메일 발송 연동 가능
// if (level === 'error') sendSlackAlert(message)
