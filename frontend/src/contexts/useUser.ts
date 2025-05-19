//Context 접근 훅	useUser
import { useContext } from "react";
import { UserContext } from "./Usercontext";

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUser는 UserProvider 안에서만 사용해야 합니다.");
  return context;
};
