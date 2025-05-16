const Todo = require("../models/todoModel");

exports.getTodos = (req, res) => {
  Todo.getAllTodos((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.createTodo = (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  Todo.createTodo(title, (err, newTodo) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(newTodo);
  });
};

exports.updateTodo = (req, res) => {
  const { id } = req.params;
  const { is_done } = req.body;
  Todo.updateTodo(id, is_done, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Updated" });
  });
};

exports.deleteTodo = (req, res) => {
  const { id } = req.params;
  Todo.deleteTodo(id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted" });
  });
};
