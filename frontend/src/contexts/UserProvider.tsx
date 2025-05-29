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
  const [id, setId] = useState<number | undefined>(undefined);
  const [username, setUsername] = useState<string>("");
  const [employee_number, setEmployeeNumber] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<RoleType>("user");
  const [department_code, setDepartmentCode] = useState<string>("");
  const [position_code, setPositionCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login: UserContextType["login"] = ({
    id,
    username,
    name,
    token,
    role,
  }) => {
    console.log("[login] 전달된 값:", { id, username, name, token, role });
    setId(id);
    setUsername(username);
    setEmployeeNumber(employee_number);
    setName(name);
    setEmail(email);
    setToken(token);
    setRole(role);
    setDepartmentCode(department_code);
    setPositionCode(position_code);
    setAccessToken(token); // axios용 토큰 설정
    localStorage.setItem(
      "auth",
      JSON.stringify({ id, username, name, token, role }) //넘길 값 추가
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
    setId(undefined);
    setUsername("");
    setEmployeeNumber("");
    setName("");
    setEmail("");
    setToken(null);
    setRole("user");
    setDepartmentCode("");
    setPositionCode("");
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
        id,
        username,
        employee_number,
        name,
        email,
        token,
        role,
        department_code,
        position_code,
      });
      if (token && isTokenExpired(token)) {
        console.warn("⏰ JWT 토큰 만료됨. 자동 로그아웃 처리.");
        toast.info("로그인 세션이 만료되어 자동 로그아웃됩니다.");
        logout().finally(() => setIsLoading(false)); // 로그아웃 후 로딩 완료
      } else {
        setId(id);
        setUsername(username);
        setEmployeeNumber(employee_number);
        setName(name);
        setEmail(email);
        setToken(token);
        setRole(role);
        setDepartmentCode(department_code);
        setPositionCode(position_code);
        setIsLoading(false); // 복원 완료 후 로딩 종료
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
        id,
        username,
        employee_number,
        name,
        email,
        token,
        role,
        department_code,
        position_code,
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
