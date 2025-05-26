const db = require("../config/db");
const { formatToKstString } = require("../utils/time");

/**
 * 시스템 로그 삽입 함수
 * @param {number|null} user_id - 사용자 ID (없을 경우 null)
 * @param {string} username - 사용자명 (없을 경우 공백 또는 'UNKNOWN')
 * @param {string} action - 수행된 작업 코드 (예: LOGIN, LOGIN_FAIL)
 * @param {string} detail - 상세 설명
 * @param {string} ip - 클라이언트 IP 주소
 * @param {string} userAgent - 클라이언트 브라우저 정보
 */
const insertSystemLog = (user_id, username, action, detail, ip, userAgent) => {
  const createdAt = formatToKstString();
  const query = `
    INSERT INTO system_logs (user_id, username, action, detail, ip, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [user_id, username, action, detail, ip, userAgent, createdAt],
    function (err) {
      if (err) {
        console.error("❌ 시스템 로그 저장 실패:");
        console.error("쿼리:", query);
        console.error("파라미터:", {
          user_id,
          username,
          action,
          detail,
          ip,
          userAgent,
          createdAt,
        });
        console.error("에러 메시지:", err.message);
      } else {
        // console.log("시스템 로그 저장 완료 (log_id:", this.lastID, ")");
      }
    }
  );
};

module.exports = { insertSystemLog };
