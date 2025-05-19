//Provider 컴포넌트	UserProvider
import { useState } from "react";
import type { ReactNode } from "react";
import { UserContext } from "./Usercontext";
import type { UserContextType, RoleType } from "./types";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState("사용자");
  const [name, setName] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<RoleType>("user");

  const login: UserContextType["login"] = ({ username, name, token, role }) => {
    setUsername(username);
    setName(name);
    setToken(token);
    setRole(role);
    localStorage.setItem(
      "auth",
      JSON.stringify({ username, name, token, role })
    );
  };

  const logout = async () => {
    try {
      const stored = localStorage.getItem("auth");
      const token = stored ? JSON.parse(stored).token : null;

      if (token) {
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.warn("❗ 서버 로그아웃 기록 실패:", err);
    }

    setUsername("");
    setName("");
    setToken(null);
    setRole("user");
    localStorage.removeItem("auth");
  };

  return (
    <UserContext.Provider
      value={{ username, name, token, role, login, logout }}
    >
      {children}
    </UserContext.Provider>
  );
};
