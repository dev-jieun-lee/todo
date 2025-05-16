const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// DB 파일 경로 설정 (.env에서 따로 설정해도 가능)
const dbPath = path.resolve(__dirname, "../../database/database.sqlite");

// DB 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ DB 연결 실패:", err.message);
  } else {
    console.log("✅ SQLite 데이터베이스 연결됨");
  }
});

module.exports = db;
