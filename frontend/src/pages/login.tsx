import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/useUser";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useUser();

  const handleLogin = async () => {
    try {
      const res = await axios.post("/api/auth/login", { username, password });

      const { token, user } = res.data; // 🔑 서버에서 token과 user 정보 반환

      // Context에도 저장

      login({
        token,
        username: user.username,
        name: user.name,
        role: user.role,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">그룹웨어 로그인</h2>

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
