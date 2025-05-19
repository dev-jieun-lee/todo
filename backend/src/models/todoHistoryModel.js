const db = require("../config/db");

exports.logHistory = (todo_id, action, details = "", user_id = "userA") => {
  db.run(
    "INSERT INTO todo_history (todo_id, action, details, user_id) VALUES (?, ?, ?, ?)",
    [todo_id, action, details, user_id]
  );
};

exports.getAllByUser = (user_id, callback) => {
  db.all(
    "SELECT * FROM todo_history WHERE user_id = ? ORDER BY timestamp DESC",
    [user_id],
    callback
  );
};
