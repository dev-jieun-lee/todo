// models/vacationModel.js

const db = require("../config/db");

/**
 * 중복 휴가 존재 여부 검사
 * - 연차(FULL): 날짜만 검사
 * - 반차/시차(HALF/HOUR): 날짜 + 시간 겹침 여부 검사
 */
exports.findOverlappingVacation = (
  userId,
  startDate,
  endDate,
  startTime,
  endTime,
  durationUnit,
  callback
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
    startDate, // 동일 날짜일 때
    endTime || "00:00", // new end <= existing start → 겹치지 않음
    startTime || "23:59", // new start >= existing end → 겹치지 않음
  ];
  console.log("🧪 [중복검사 요청 파라미터]", {
    userId,
    startDate,
    endDate,
    startTime,
    endTime,
    durationUnit,
  });
  db.get(sql, params, (err, row) => {
    if (err) {
      console.error("❌ 중복 검사 쿼리 오류:", err);
      return callback(err, null);
    }

    if (row) {
      console.log("⚠️ [중복된 기존 휴가 데이터]", row);
    } else {
      console.log("중복 없음");
    }

    callback(null, row);
  });
};
