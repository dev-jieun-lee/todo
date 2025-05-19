import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// 타입 정의: username 상태와 setter 함수 제공
type UserContextType = {
  username: string;
  setUsername: (name: string) => void;
};

// Context 생성: 초기값은 undefined (필수 사용 보장용)
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider 컴포넌트 정의: App.tsx 등에서 이걸 감싸야 함
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState("사용자");

  return (
    <UserContext.Provider value={{ username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
};

// Context 사용 훅: 내부에서 useUser()로 접근 가능
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser는 UserProvider 안에서만 사용.");
  return context;
};
