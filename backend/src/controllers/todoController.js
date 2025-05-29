const { dbAll, dbRun } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS, LOG_ACTION_LABELS } = require("../utils/logActions");

exports.getTodos = async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM todos ORDER BY id DESC", []);
    res.json(rows);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_VIEW_FAIL,
      `할 일 조회 실패: ${err.message}`,
      "error"
    );
    return res.status(500).json({ error: "할 일 목록 조회 실패" });
  }
};

exports.createTodo = async (req, res) => {
  const { title } = req.body;
  if (!title) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_CREATE_FAIL,
      "할 일 등록 실패 - title 누락",
      "error"
    );
    return res.status(400).json({ error: "title is required" });
  }

  try {
    const result = await dbRun(
      "INSERT INTO todos (title, is_done) VALUES (?, 0)",
      [title]
    );
    const newTodo = { id: result.lastID, title, is_done: 0 };

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_CREATE,
      `${LOG_ACTION_LABELS.TODO_CREATE}: ${title}`,
      "info"
    );

    res.status(201).json(newTodo);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_CREATE_FAIL,
      `예외 발생: ${err.message}`,
      "error"
    );
    return res.status(500).json({ error: "할 일 등록 실패" });
  }
};

exports.updateTodo = async (req, res) => {
  const { id } = req.params;
  const { is_done } = req.body;

  try {
    await dbRun("UPDATE todos SET is_done = ? WHERE id = ?", [is_done, id]);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_UPDATE,
      `${LOG_ACTION_LABELS.TODO_UPDATE}: ID ${id}, 완료 상태 → ${is_done}`,
      "info"
    );
    res.json({ message: "Updated" });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_UPDATE_FAIL,
      `예외 발생: ${err.message}`,
      "error"
    );
    return res.status(500).json({ error: "할 일 수정 실패" });
  }
};

exports.deleteTodo = async (req, res) => {
  const { id } = req.params;

  try {
    await dbRun("DELETE FROM todos WHERE id = ?", [id]);
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_DELETE,
      `${LOG_ACTION_LABELS.TODO_DELETE}: ID ${id}`,
      "info"
    );
    res.json({ message: "Deleted" });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_DELETE_FAIL,
      `예외 발생: ${err.message}`,
      "error"
    );
    return res.status(500).json({ error: "할 일 삭제 실패" });
  }
};
