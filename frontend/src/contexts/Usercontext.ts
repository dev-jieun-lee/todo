//createContext() 정의	UserContext
import { createContext } from "react";
import type { UserContextType } from "./types";

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);
