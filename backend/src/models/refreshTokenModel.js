const db = require("../config/db");

exports.saveRefreshToken = (userId, token, expiresAt, createdAt, callback) => {
  db.run(
    `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)`,
    [userId, token, expiresAt, createdAt],
    callback
  );
};

exports.findRefreshToken = (token, callback) => {
  db.get(`SELECT * FROM refresh_tokens WHERE token = ?`, [token], callback);
};

exports.deleteRefreshToken = (token, callback) => {
  db.run(`DELETE FROM refresh_tokens WHERE token = ?`, [token], callback);
};

exports.deleteAllTokensByUserId = (userId, callback) => {
  db.run(`DELETE FROM refresh_tokens WHERE user_id = ?`, [userId], callback);
};

exports.getTokensByUserId = (userId, callback) => {
  db.all(`SELECT * FROM refresh_tokens WHERE user_id = ?`, [userId], callback);
};
