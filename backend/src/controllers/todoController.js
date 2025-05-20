const Todo = require("../models/todoModel");
const {
  handleDbError,
  logWarning,
  logSystemAction,
} = require("../utils/handleError");
const { LOG_ACTIONS, LOG_ACTION_LABELS } = require("../utils/logActions");

exports.getTodos = (req, res) => {
  Todo.getAllTodos((err, rows) => {
    if (err) return handleDbError(res, "할 일 목록 조회", err);
    res.json(rows);
  });
};

exports.createTodo = (req, res) => {
  const { title } = req.body;
  if (!title) {
    logWarning("할 일 등록 실패 - title 누락");
    return res.status(400).json({ error: "title is required" });
  }

  Todo.createTodo(title, (err, newTodo) => {
    if (err) return handleDbError(res, "할 일 등록", err);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_CREATE,
      `${LOG_ACTION_LABELS.TODO_CREATE}: ${title}`
    );

    res.status(201).json(newTodo);
  });
};

exports.updateTodo = (req, res) => {
  const { id } = req.params;
  const { is_done } = req.body;

  Todo.updateTodo(id, is_done, (err) => {
    if (err) return handleDbError(res, "할 일 수정", err);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_UPDATE,
      `${LOG_ACTION_LABELS.TODO_UPDATE}: ID ${id}, 완료 상태 → ${is_done}`
    );

    res.json({ message: "Updated" });
  });
};

exports.deleteTodo = (req, res) => {
  const { id } = req.params;

  Todo.deleteTodo(id, (err) => {
    if (err) return handleDbError(res, "할 일 삭제", err);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.TODO_DELETE,
      `${LOG_ACTION_LABELS.TODO_DELETE}: ID ${id}`
    );

    res.json({ message: "Deleted" });
  });
};
