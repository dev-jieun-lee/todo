export type RoleType = "user" | "ADMIN" | "USER" | "HR";

export type UserContextType = {
  id: number;
  username: string;
  name: string;
  token: string | null;
  role: RoleType;
  login: (data: {
    username: string;
    name: string;
    token: string;
    role: RoleType;
  }) => void;
  logout: () => void;
  updateToken: (newToken: string) => void;
  isLoading: boolean;
};
