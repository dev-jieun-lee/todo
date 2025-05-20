import { useEffect, useState } from "react";
import api from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "../../../components/ui/table";

interface SessionInfo {
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
  tokens: {
    id: number;
    token: string;
    expires_at: string;
    created_at: string;
  }[];
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  useEffect(() => {
    api
      .get("/admin/sessions")
      .then((res) => setSessions(res.data))
      .catch(() => toast.error("세션 정보를 불러오지 못했습니다."));
  }, []);

  const handleForceLogout = async (userId: number) => {
    try {
      await api.post("/admin/force-logout", { user_id: userId });
      toast.success("해당 사용자의 세션이 종료되었습니다.");
      setSessions((prev) =>
        prev.map((s) => (s.user.id === userId ? { ...s, tokens: [] } : s))
      );
    } catch {
      toast.error("강제 로그아웃에 실패했습니다.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🛡️ 사용자 세션 관리</h2>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>이름</TableCell>
                <TableCell>아이디</TableCell>
                <TableCell>권한</TableCell>
                <TableCell>세션 수</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(({ user, tokens }) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{tokens.length}</TableCell>
                  <TableCell>
                    {tokens.length > 0 && (
                      <Button
                        variant="destructive"
                        onClick={() => handleForceLogout(user.id)}
                      >
                        강제 로그아웃
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
