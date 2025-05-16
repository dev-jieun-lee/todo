import type { TodoItem } from "../types/todo";

const STORAGE_KEY = "my_todo_list";

export const loadTodos = (): TodoItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveTodos = (todos: TodoItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
};
