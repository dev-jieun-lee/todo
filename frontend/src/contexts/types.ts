export type RoleType = "user" | "ADMIN" | "USER" | "HR";

export type UserContextType = {
  id: number | undefined;
  username: string;
  employee_number: string;
  name: string;
  email?: string; // (선택적, 옵셔널)
  token: string | null;
  role: RoleType;
  department_code: string;
  position_code: string;
  team_code: string;
  login: (data: {
    id: number;
    username: string;
    name: string;
    email: string;
    token: string;
    role: RoleType;
    employee_number: string;
    department_code?: string;
    position_code?: string;
    team_code: string;
  }) => void;
  logout: () => void;
  updateToken: (newToken: string) => void;
  isLoading: boolean;
};
