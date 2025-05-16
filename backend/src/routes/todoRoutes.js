const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const db = require("../config/db");

//기본 todo CRUD
router.get("/", todoController.getTodos);
router.post("/", todoController.createTodo);
router.put("/:id", todoController.updateTodo);
router.delete("/:id", todoController.deleteTodo);
// 전체 이력 조회
router.get("/history/all", (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ error: "user_id is required" });
  }

  db.all(
    "SELECT * FROM todo_history WHERE user_id = ? ORDER BY timestamp DESC",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;
