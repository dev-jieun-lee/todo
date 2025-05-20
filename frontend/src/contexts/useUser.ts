//Context 접근 훅	useUser
import { useContext } from "react";
import { UserContext } from "./Usercontext";

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUser는 UserProvider 안에서만 사용해야 합니다.");
  return context;
};
export const isTokenExpired = (token: string): boolean => {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch {
    return true; // 오류나면 만료로 간주
  }
};
