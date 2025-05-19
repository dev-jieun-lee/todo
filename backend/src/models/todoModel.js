const db = require("../config/db");
const { logHistory } = require("./todoHistoryModel");

// ✅ 히스토리 테이블 생성
db.run(`CREATE TABLE IF NOT EXISTS todo_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  todo_id INTEGER,
  action TEXT,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// ✅ todos 테이블 생성
db.run(`CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  is_done INTEGER DEFAULT 0
)`);

// ✅ 모델 내보내기
module.exports = {
  getAllTodos: (callback) => {
    db.all("SELECT * FROM todos", [], callback);
  },

  createTodo: (title, callback) => {
    db.run("INSERT INTO todos (title) VALUES (?)", [title], function (err) {
      if (!err) {
        logHistory(this.lastID, "CREATE", `title: ${title}`, "userA");
      }
      callback(err, { id: this.lastID, title, is_done: 0 });
    });
  },

  updateTodo: (id, is_done, callback) => {
    db.run(
      "UPDATE todos SET is_done = ? WHERE id = ?",
      [is_done, id],
      function (err) {
        if (!err) {
          logHistory(id, "UPDATE", `is_done: ${is_done}`, "userA");
        }
        callback(err);
      }
    );
  },

  deleteTodo: (id, callback) => {
    db.run("DELETE FROM todos WHERE id = ?", [id], function (err) {
      if (!err) {
        logHistory(id, "DELETE", `todo deleted`, "userA");
      }
      callback(err);
    });
  },
};
