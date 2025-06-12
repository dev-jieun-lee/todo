import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/useUser";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login, logout } = useUser();

  const handleLogin = async () => {
    try {
      //기존 세션 초기화 (쿠키, 메모리, localStorage)
      await logout();
      const res = await axios.post("/api/auth/login", { username, password });

      const { token, user } = res.data; // 🔑 서버에서 token과 user 정보 반환
      //로그인 정보 저장 + 메모리 토큰 등록
      login({
        ...user,
        token, // token은 별도로 추가
      });
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Axios 에러:", err.message);
        alert(
          err.response?.data?.error ||
            "로그인 실패: 사용자명 또는 비밀번호를 확인하세요."
        );
      } else {
        console.error("알 수 없는 오류:", err);
        alert("알 수 없는 오류가 발생했습니다.");
      }
    }
  };
  // 테스트 계정 목록
  const testUsers = {
    leader: { username: "kimjj", password: "0" },
    employee: { username: "syjeong", password: "0" },
    manager: { username: "shincy", password: "0" },
  };

  // 테스트로그인
  const handleTestLogin = async (type: keyof typeof testUsers) => {
    try {
      await logout();
      const { username, password } = testUsers[type];
      const res = await axios.post("/api/auth/login", { username, password });
      const { token, user } = res.data;

      login({
        ...user,
        token, // token은 별도로 추가
      });
      navigate("/");
    } catch (err) {
      console.error("❌ 테스트 계정 로그인 실패:", err);
      alert("테스트 계정 로그인 실패");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">그룹웨어 로그인</h2>

        {/* 테스트로그인버튼 */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            className="bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm"
            onClick={() => handleTestLogin("leader")}
          >
            👨‍💼 팀장 로그인
          </button>
          <button
            className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm"
            onClick={() => handleTestLogin("employee")}
          >
            👩‍💻 사원 로그인
          </button>
          <button
            className="bg-purple-500 text-white py-2 rounded hover:bg-purple-600 text-sm"
            onClick={() => handleTestLogin("manager")}
          >
            🧑‍🏫 부장 로그인
          </button>
        </div>
        <div className="text-center text-gray-400 my-4">또는</div>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">아이디</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디를 입력하세요"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
        >
          로그인
        </button>
        <p className="mt-4 text-sm text-gray-500 text-center">
          계정 관련 문의는 관리자에게 연락하세요: <br />
          <span className="font-medium text-blue-600">admin@example.com</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
