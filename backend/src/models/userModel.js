const db = require("../config/db");

const findUserByUsername = (username, callback) => {
  const query = `SELECT * FROM users WHERE username = ?`;

  db.get(query, [username], (err, row) => {
    if (err) {
      console.error(`❌ 사용자 조회 중 DB 오류 (username: ${username})`, err);
    } else if (!row) {
      console.warn(`⚠️ 사용자 없음 (username: ${username})`);
    } else {
      console.log(`✅ 사용자 조회 성공: ${username}`);
    }
    callback(err, row);
  });
};

module.exports = { findUserByUsername };
