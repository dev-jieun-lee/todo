// utils/dbHelpers.js
const db = require("../config/db");

exports.dbGet = (sql, params) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error("❌ dbGet 에러:", sql, params, err);
        reject(err);
      } else {
        if (!row) console.warn("⚠️ 결과 없음:", sql, params);
        resolve(row);
      }
    });
  });

exports.dbAll = (sql, params) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("❌ dbAll 에러:", sql, params, err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });

exports.dbRun = (sql, params) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error("❌ dbRun 에러:", sql, params, err);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
