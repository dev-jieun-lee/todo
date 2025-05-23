import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "../../components/ui/table";
import { useUser } from "../../contexts/useUser";

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
  const { username: currentUsername } = useUser();

  // 서버에서 전체 세션 목록 다시 불러오기
  const fetchSessions = () => {
    api
      .get("/admin/sessions")
      .then((res) => setSessions(res.data))
      .catch(() => toast.error("세션 정보를 불러오지 못했습니다."));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // 강제 로그아웃 시 서버에서 삭제 후 전체 목록 다시 로딩
  const handleForceLogout = async (userId: number) => {
    try {
      await api.post("/admin/force-logout", { user_id: userId });
      toast.success("해당 사용자의 세션이 종료되었습니다.");
      fetchSessions(); // 🔄 최신 정보로 동기화
    } catch {
      toast.error("강제 로그아웃에 실패했습니다.");
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🛡️ 사용자 세션 관리</h2>
        <Button variant="outline" onClick={fetchSessions}>
          🔄 새로고침
        </Button>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>이름</TableCell>
                <TableCell>아이디</TableCell>
                <TableCell>권한</TableCell>
                <TableCell>세션 수</TableCell>
                <TableCell>세션 정보</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(({ user, tokens }) => {
                const isCurrentUser = user.username === currentUsername;
                return (
                  <TableRow
                    key={user.id}
                    className={isCurrentUser ? "bg-gray-100" : ""}
                  >
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{tokens.length}</TableCell>
                    <TableCell>
                      {tokens.length > 0 ? (
                        tokens.map((t) => (
                          <div key={t.id} className="mb-1 text-xs">
                            📅 {new Date(t.created_at).toLocaleString()}
                            <br />⏰ {new Date(t.expires_at).toLocaleString()}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">없음</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isCurrentUser && tokens.length > 0 && (
                        <Button
                          variant="destructive"
                          onClick={() => handleForceLogout(user.id)}
                        >
                          강제 로그아웃
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
