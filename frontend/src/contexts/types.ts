export type RoleType = "user" | "ADMIN";

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
