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

  // 🟢 로그인 함수 (여기서 id/username 등 찍기!)
  const login: UserContextType["login"] = (user) => {
    console.log("[login] 전달된 값:", user);
    setId(user.id);
    setUsername(user.username);
    setEmployeeNumber(user.employee_number ?? "");
    setName(user.name);
    setEmail(user.email ?? "");
    setToken(user.token);
    setRole(user.role);
    setDepartmentCode(user.department_code ?? "");
    setPositionCode(user.position_code ?? "");
    setAccessToken(user.token);

    // localStorage에 모든 정보 저장 (여기도 콘솔!)
    const authObj = {
      id: user.id,
      username: user.username,
      employee_number: user.employee_number ?? "",
      name: user.name,
      email: user.email ?? "",
      token: user.token,
      role: user.role,
      department_code: user.department_code ?? "",
      position_code: user.position_code ?? "",
    };
    console.log("[login] localStorage에 저장할 값:", authObj);
    localStorage.setItem("auth", JSON.stringify(authObj));
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
      const {
        id,
        username,
        employee_number,
        name,
        email,
        token,
        role,
        department_code,
        position_code,
      } = JSON.parse(stored);

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

      if (token) setAccessToken(token);

      if (token && isTokenExpired(token)) {
        console.warn("⏰ JWT 토큰 만료됨. 자동 로그아웃 처리.");
        toast.info("로그인 세션이 만료되어 자동 로그아웃됩니다.");
        logout().finally(() => setIsLoading(false)); // 로그아웃 후 로딩 완료
      } else {
        setId(id);
        setUsername(username);
        setEmployeeNumber(employee_number ?? "");
        setName(name);
        setEmail(email ?? "");
        setToken(token);
        setRole(role);
        setDepartmentCode(department_code ?? "");
        setPositionCode(position_code ?? "");
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

  //토큰 갱신 함수
  const updateToken = (newToken: string) => {
    setToken(newToken);

    const stored = localStorage.getItem("auth");
    if (stored) {
      const auth = JSON.parse(stored);
      auth.token = newToken;
      localStorage.setItem("auth", JSON.stringify(auth));
      console.log("[updateToken] localStorage 토큰 갱신:", newToken);
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
