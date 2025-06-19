const { dbAll } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

/**
 * 공휴일 목록 조회
 * @route GET /api/holidays
 * @desc 특정 연도 또는 날짜 범위의 공휴일 목록을 조회
 */
exports.getHolidays = async (req, res) => {
  const { year, start_date, end_date } = req.query;

  try {
    let sql = `
      SELECT id, date, name, year, month, day, is_recurring
      FROM holidays
      WHERE 1=1
    `;
    const params = [];

    // 연도 필터
    if (year) {
      sql += ` AND year = ?`;
      params.push(year);
    }

    // 날짜 범위 필터
    if (start_date && end_date) {
      sql += ` AND date BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }

    sql += ` ORDER BY date ASC`;

    const holidays = await dbAll(sql, params);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `공휴일 조회: ${holidays.length}건`,
      "info"
    );

    res.json(holidays);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      `공휴일 조회 실패: ${err.message}`,
      "error"
    );
    return res.status(500).json({ error: "공휴일 조회 실패" });
  }
};

/**
 * 특정 월의 공휴일 조회
 * @route GET /api/holidays/month
 * @desc 특정 연도/월의 공휴일 목록을 조회
 */
exports.getHolidaysByMonth = async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: "year와 month 파라미터가 필요합니다." });
  }

  try {
    const sql = `
      SELECT id, date, name, year, month, day, is_recurring
      FROM holidays
      WHERE year = ? AND month = ?
      ORDER BY day ASC
    `;

    const holidays = await dbAll(sql, [year, month]);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `${year}년 ${month}월 공휴일 조회: ${holidays.length}건`,
      "info"
    );

    res.json(holidays);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      `월별 공휴일 조회 실패: ${err.message}`,
      "error"
    );
    return res.status(500).json({ error: "월별 공휴일 조회 실패" });
  }
}; 