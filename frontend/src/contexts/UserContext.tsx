//	사용자 인증/역할 상태 전역 관리
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type RoleType = "user" | "admin";

type UserContextType = {
  username: string;
  token: string | null;
  role: RoleType;
  login: (info: { username: string; token: string; role: RoleType }) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState("사용자");
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<RoleType>("user");

  const login = ({
    username,
    token,
    role,
  }: {
    username: string;
    token: string;
    role: RoleType;
  }) => {
    setUsername(username);
    setToken(token);
    setRole(role);
    localStorage.setItem("auth", JSON.stringify({ username, token, role }));
  };

  const logout = () => {
    setUsername("");
    setToken(null);
    setRole("user");
    localStorage.removeItem("auth");
  };

  return (
    <UserContext.Provider value={{ username, token, role, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser는 UserProvider 안에서만 사용.");
  return context;
};
