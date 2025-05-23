//Provider 컴포넌트	UserProvider
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { UserContext } from "./Usercontext";
import type { UserContextType, RoleType } from "./types";
import { isTokenExpired } from "../contexts/useUser";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { setAccessToken, setUpdateTokenFunction } from "../utils/tokenManager";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState("사용자");
  const [name, setName] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<RoleType>("user");
  const [isLoading, setIsLoading] = useState(true);

  const login: UserContextType["login"] = ({ username, name, token, role }) => {
    console.log("[login] 전달된 값:", { username, name, token, role });
    setUsername(username);
    setName(name);
    setToken(token);
    setRole(role);
    setAccessToken(token); // axios용 토큰 설정
    localStorage.setItem(
      "auth",
      JSON.stringify({ username, name, token, role })
    );
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // 쿠키(Refresh Token) 포함
      });
    } catch (err) {
      console.warn("❗ 서버 로그아웃 기록 실패:", err);
    }

    setUsername("");
    setName("");
    setToken(null);
    setRole("user");
    localStorage.removeItem("auth");
    setAccessToken(""); // 메모리 토큰 초기화
  };

  //앱 최초 로딩 시 토큰 만료 검사
  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      const { username, name, token, role } = JSON.parse(stored);
      if (token) setAccessToken(token);
      console.log("🗂️ [초기 로딩] localStorage auth 값:", {
        username,
        name,
        token,
        role,
      });
      if (token && isTokenExpired(token)) {
        console.warn("⏰ JWT 토큰 만료됨. 자동 로그아웃 처리.");
        toast.info("로그인 세션이 만료되어 자동 로그아웃됩니다.");
        logout().finally(() => setIsLoading(false)); // 로그아웃 후 로딩 완료
      } else {
        setUsername(username);
        setName(name);
        setToken(token);
        setRole(role);
        setIsLoading(false); // ✅ 복원 완료 후 로딩 종료
      }
    } else {
      setIsLoading(false); // localStorage 없을 때도 종료
    }
  }, []);

  //로그인된 상태에서 주기적으로 만료 확인
  useEffect(() => {
    const interval = setInterval(() => {
      if (token && isTokenExpired(token)) {
        console.warn("⏰ 토큰이 만료되어 자동 로그아웃됩니다.");
        toast.info("로그인 세션이 만료되어 자동 로그아웃됩니다.");
        logout();
      }
    }, 60000); // 1분 간격으로 확인

    return () => clearInterval(interval); // 언마운트 시 제거
  }, [token]);

  const updateToken = (newToken: string) => {
    setToken(newToken);

    const stored = localStorage.getItem("auth");
    if (stored) {
      const auth = JSON.parse(stored);
      auth.token = newToken;
      localStorage.setItem("auth", JSON.stringify(auth));
    }
  };
  useEffect(() => {
    setUpdateTokenFunction(updateToken);
  }, []);

  return (
    <UserContext.Provider
      value={{
        username,
        name,
        token,
        role,
        login,
        logout,
        updateToken,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
