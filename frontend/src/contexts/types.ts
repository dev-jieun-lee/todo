export type RoleType = "user" | "admin";

export type UserContextType = {
  username: string;
  name: string;
  token: string | null;
  role: RoleType;
  login: (info: {
    username: string;
    name: string;
    token: string;
    role: RoleType;
  }) => void;
  logout: () => void;
};
