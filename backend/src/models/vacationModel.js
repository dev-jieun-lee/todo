const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const { dbGet } = require("../utils/dbHelpers");
exports.findOverlappingVacation = async (
  req,
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
  `;

  // 시간 단위가 FULL인 경우는 시간 겹침 검사 필요 없으므로 startTime/endTime을 빈값으로 처리
  const stTime = durationUnit === "FULL" ? null : startTime || "00:00";
  const edTime = durationUnit === "FULL" ? null : endTime || "23:59";

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
    edTime,
    stTime,
  ];

  logSystemAction(
    req,
    req.user ?? { id: userId },
    LOG_ACTIONS.VALIDATE,
    `중복검사 요청 파라미터: 사용자 ID ${userId}, 시작일자 ${startDate}, 종료일자 ${endDate}, 시작시간 ${startTime}, 종료시간 ${endTime}, 시간단위 ${durationUnit}`,
    "info"
  );
  // 로그는 반드시 sql, params 선언 후 출력
  console.log("findOverlappingVacation 쿼리:", sql);
  console.log("파라미터:", params);

  try {
    const row = await dbGet(sql, params);

    if (row) {
      logSystemAction(
        req,
        req.user ?? { id: userId },
        LOG_ACTIONS.VALIDATE_FAIL,
        "휴가 중복됨",
        "warn"
      );
    } else {
      logSystemAction(
        req,
        req.user ?? { id: userId },
        LOG_ACTIONS.VALIDATE,
        "중복 없음",
        "info"
      );
    }

    return row;
  } catch (err) {
    logSystemAction(
      req,
      req.user ?? { id: userId },
      LOG_ACTIONS.ERROR,
      `중복 검사 쿼리 실패: ${err.message}`,
      "error"
    );
    throw err;
  }
};
