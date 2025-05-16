import { useEffect, useState } from "react";
import axios from "axios";

interface HistoryItem {
  id: number;
  todo_id: number;
  action: string;
  details: string;
  timestamp: string;
}

const TodoHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/todos/history/all?user_id=userA")
      .then((res) => {
        console.log("✅ 불러온 이력:", res.data); // 👉 여기로 먼저 확인
        setHistory(res.data); // ✅ 실제 상태 반영
      });
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📜 전체 TODO 이력</h2>
      {history.length === 0 ? (
        <p className="text-gray-500">이력이 없습니다.</p>
      ) : (
        <ul className="space-y-3 text-sm text-gray-800">
          {history.map((h) => (
            <li key={h.id} className="border-b pb-2">
              <div>🆔 Todo ID: {h.todo_id}</div>
              <div>🗂 {h.action}</div>
              <div>📄 {h.details}</div>
              <div>⏰ {new Date(h.timestamp).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodoHistory;
