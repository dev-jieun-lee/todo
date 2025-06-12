const { dbGet, dbAll } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

/**
 * 사용자 이름으로 사용자 조회
 */
const findUserByUsername = (username, callback) => {
  const query = `
  SELECT
    id, username, password, name, email, role, employee_number,
    department_code, team_code, position_code, status
  FROM users
  WHERE username = ?
`;
  dbGet(query, [username])
    .then((row) => {
      if (!row) {
        logSystemAction(
          null,
          null,
          LOG_ACTIONS.READ_FAIL,
          `사용자 없음 (username: ${username})`,
          "warn"
        );
      } else {
        logSystemAction(
          null,
          null,
          LOG_ACTIONS.READ,
          `사용자 조회 성공 (username: ${username})`,
          "info"
        );
      }
      callback(null, row);
    })
    .catch((err) => {
      logSystemAction(
        null,
        null,
        LOG_ACTIONS.ERROR,
        `DB 오류: 사용자 조회 (username: ${username}) - ${err.message}`,
        "error"
      );
      callback(err, null);
    });
};

/**
 * 모든 사용자 조회
 */
const findAllUsers = (callback) => {
  const query = "SELECT id, username, name, role FROM users";
  dbAll(query, [])
    .then((rows) => {
      logSystemAction(
        null,
        null,
        LOG_ACTIONS.READ,
        `모든 사용자 조회 성공 (user count: ${rows.length})`,
        "info"
      );
      callback(null, rows);
    })
    .catch((err) => {
      logSystemAction(
        null,
        null,
        LOG_ACTIONS.ERROR,
        `DB 오류: 모든 사용자 조회 - ${err.message}`,
        "error"
      );
      callback(err, null);
    });
};

/**
 * 사용자 ID로 사용자 조회
 */
const findUserById = (id, callback) => {
  const query = "SELECT * FROM users WHERE id = ?";
  dbGet(query, [id])
    .then((row) => {
      if (!row) {
        logSystemAction(
          null,
          null,
          LOG_ACTIONS.READ_FAIL,
          `사용자 없음 (ID: ${id})`,
          "warn"
        );
      } else {
        logSystemAction(
          null,
          null,
          LOG_ACTIONS.READ,
          `사용자 조회 성공 (ID: ${id})`,
          "info"
        );
      }
      callback(null, row);
    })
    .catch((err) => {
      logSystemAction(
        null,
        null,
        LOG_ACTIONS.ERROR,
        `DB 오류: 사용자 조회 (ID: ${id}) - ${err.message}`,
        "error"
      );
      callback(err, null);
    });
};

module.exports = {
  findUserByUsername,
  findAllUsers,
  findUserById,
};
