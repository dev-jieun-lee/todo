import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance"; // 절대경로(@) 대신 상대경로 사용
import { toast } from "react-toastify";
import { useUser } from "../../contexts/useUser"; // 사용자 정보 (선택적)

type Session = {
  id: number;
  user_id: number;
  token: string;
  user_agent: string;
  ip_address?: string;
  created_at: string;
};

const MySessionsPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  useUser();

  const fetchSessions = async () => {
    try {
      const res = await api.get("/my-sessions");
      const data = Array.isArray(res.data) ? res.data : [];
      setSessions(data);

      // JS에서 refreshToken 직접 접근 불가할 수 있으므로, 대체 확인 방식
      const cookieToken =
        typeof document !== "undefined"
          ? document.cookie
              .split("; ")
              .find((row) => row.startsWith("refreshToken="))
              ?.split("=")[1]
          : null;

      setCurrentToken(cookieToken ?? null);
    } catch (err) {
      toast.error("세션 목록 조회 실패");
      console.error(err);
      setSessions([]);
    }
  };

  const handleDelete = async (token: string) => {
    try {
      await api.delete(`/my-sessions/${token}`);
      toast.success("세션 삭제 완료");
      fetchSessions();
    } catch (err) {
      toast.error("세션 삭제 실패");
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.delete("/my-sessions");
      toast.success("다른 세션 전부 삭제 완료");
      fetchSessions();
    } catch (err) {
      toast.error("일괄 삭제 실패");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">🔒 내 세션 관리</h2>
      <p className="text-gray-600 text-sm mb-4">
        로그인한 기기/브라우저 목록입니다. 다른 세션을 강제 종료할 수 있습니다.
      </p>

      <button
        onClick={handleDeleteAll}
        className="mb-4 px-4 py-2 border border-red-500 text-red-600 text-sm rounded hover:bg-red-50"
      >
        다른 모든 세션 로그아웃
      </button>

      <ul className="space-y-2">
        {sessions.map((s) => (
          <li
            key={s.token}
            className="border p-3 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-semibold text-sm">
                {s.user_agent ? s.user_agent.slice(0, 80) : "(알 수 없음)"}
              </div>
              <div className="text-xs text-gray-500">
                {s.created_at}
                {s.token === currentToken && (
                  <span className="ml-2 text-green-600 font-bold">
                    (현재 세션)
                  </span>
                )}
              </div>
            </div>
            {s.token !== currentToken && (
              <button
                onClick={() => handleDelete(s.token)}
                className="text-red-500 text-sm hover:underline"
              >
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MySessionsPage;
