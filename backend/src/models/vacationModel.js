// models/vacationModel.js
const { dbGet } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

/**
 * 중복 휴가 존재 여부 검사 (async/await 버전)
 * - 연차(FULL): 날짜만 검사
 * - 반차/시차(HALF/HOUR): 날짜 + 시간 겹침 여부 검사
 */
exports.findOverlappingVacation = async (
  req, // log 기록용
  userId,
  startDate,
  endDate,
  startTime,
  endTime,
  durationUnit
) => {
  const sql = `
    SELECT *
    FROM vacations
    WHERE user_id = ?
      AND status != 'CANCELLED'
      AND (
        (
          -- 연차 또는 날짜 단위 검사
          duration_unit = 'FULL'
          AND (
            ? BETWEEN start_date AND end_date
            OR ? BETWEEN start_date AND end_date
            OR start_date BETWEEN ? AND ?
            OR end_date BETWEEN ? AND ?
          )
        )
        OR (
          -- 반차/시차 등 시간 단위 검사 (같은 날 + 시간 겹침)
          start_date = ?
          AND duration_unit IN ('HOUR', 'HALF')
          AND start_time IS NOT NULL
          AND end_time IS NOT NULL
          AND NOT (
            ? <= start_time OR
            ? >= end_time
          )
        )
      )
    LIMIT 1
  `;

  const params = [
    userId,
    // 날짜 기준 겹침 검사 (FULL)
    startDate,
    endDate,
    startDate,
    endDate,
    startDate,
    endDate,

    // 시간 기준 겹침 검사 (HOUR, HALF)
    startDate,
    endTime || "00:00",
    startTime || "23:59",
  ];
  logSystemAction(
    req,
    req.user, // 사용자 정보 (req.user에서 가져옴)
    LOG_ACTIONS.VALIDATE, // 중복 검사를 위한 로그 액션 (유효성 검사)
    `중복검사 요청 파라미터: 사용자 ID ${userId}, 시작일자 ${startDate}, 종료일자 ${endDate}, 시작시간 ${startTime}, 종료시간 ${endTime}, 시간단위 ${durationUnit}`,
    "info" // 로그 레벨: 정보
  );
  try {
    const row = await dbGet(sql, params);

    if (row) {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.VALIDATE_FAIL,
        "휴가 중복됨",
        "warn"
      );
    } else {
      logSystemAction(req, req.user, LOG_ACTIONS.VALIDATE, "중복 없음", "info");
    }

    return row;
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.ERROR,
      "중복 검사 쿼리 실패",
      "error"
    );
    throw err;
  }
};
