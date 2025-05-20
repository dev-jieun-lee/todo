import React, { useEffect, useState } from "react";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../../services/todoService";
import { useNavigate } from "react-router-dom";

interface TodoItem {
  id: number;
  title: string;
  is_done: number;
}

const TodoPage = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

  const loadTodos = async () => {
    const data = await getTodos();

    // 응답이 배열인지 확인해서 안전하게 처리
    if (Array.isArray(data)) {
      setTodos(data);
    } else {
      console.warn("🚨 getTodos 응답이 배열이 아닙니다:", data);
      setTodos([]); // fallback 처리
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const handleAdd = async () => {
    if (!input.trim()) return;
    await createTodo(input);
    setInput("");
    loadTodos();
  };

  const handleToggle = async (id: number, current: number) => {
    await updateTodo(id, current === 1 ? false : true); // 또는 !current
    loadTodos();
  };

  const handleDelete = async (id: number) => {
    await deleteTodo(id);
    loadTodos();
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">📋 TODO 리스트</h2>
        <button
          onClick={() => navigate("/todo/history")}
          className="text-sm text-blue-600 hover:underline border border-gray-300 px-2 py-1 rounded"
        >
          📜 전체 이력 보기
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="border px-2 py-1 flex-grow"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="할 일을 입력하세요"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          추가
        </button>
      </div>

      <ul>
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex justify-between items-center mb-2 border p-2 rounded"
          >
            <div>
              <span
                onClick={() => handleToggle(todo.id, todo.is_done)}
                className={`cursor-pointer ${
                  todo.is_done ? "line-through text-gray-500" : ""
                }`}
              >
                {todo.title}
              </span>
              <button
                onClick={() => navigate(`/todo/${todo.id}/history`)}
                className="ml-4 text-sm text-blue-500 hover:underline"
              >
                📜 이력
              </button>
            </div>
            <button
              onClick={() => handleDelete(todo.id)}
              className="text-red-500 hover:underline text-sm"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoPage;
