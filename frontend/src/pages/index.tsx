// 🏠 그룹웨어 홈 (pages/index.tsx)

import { Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
const Home = () => {
  const { username } = useUser();
  return (
    <div className="p-8 text-center">
      {/* 👋 사용자 인사말 */}
      <h1 className="text-2xl font-bold">안녕하세요, {username}님 👋</h1>

      {/* 🎉 환영 메시지 */}
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        그룹웨어에 오신 것을 환영합니다!
      </h1>
      <p className="text-gray-600 mb-8">
        좌측 메뉴 또는 아래 기능을 통해 다양한 업무 기능을 확인해보세요.
      </p>

      {/* 🚀 주요 기능 요약 카드 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto">
        <div className="border rounded-lg p-6 shadow hover:shadow-md transition">
          <h2 className="font-semibold text-lg mb-2">📈 성과 관리 (KPI)</h2>
          <p className="text-sm text-gray-600 mb-2">
            KPI 목표를 설정하고 달성률을 확인해보세요.
          </p>
          <Link to="/kpi/my" className="text-sm text-blue-600 hover:underline">
            내 KPI 보기 →
          </Link>
        </div>
        <div className="border rounded-lg p-6 shadow hover:shadow-md transition">
          <h2 className="font-semibold text-lg mb-2">✅ 실행 계획 (To-do)</h2>
          <p className="text-sm text-gray-600 mb-2">
            개인 및 팀 할 일을 정리하고 상태를 관리하세요.
          </p>
          <Link to="/todo/my" className="text-sm text-blue-600 hover:underline">
            나의 할 일 →
          </Link>
        </div>
        <div className="border rounded-lg p-6 shadow hover:shadow-md transition">
          <h2 className="font-semibold text-lg mb-2">📅 공용 캘린더</h2>
          <p className="text-sm text-gray-600 mb-2">
            회의, 배포, 휴가 등의 일정을 한눈에 확인할 수 있습니다.
          </p>
          <Link
            to="/calendar/team"
            className="text-sm text-blue-600 hover:underline"
          >
            팀 일정 보기 →
          </Link>
        </div>
      </div>

      {/* 📢 최근 공지사항 */}
      <div className="mt-12 text-left max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold mb-3">📢 최근 공지사항</h3>
        <ul className="text-sm text-gray-700 space-y-1 leading-relaxed">
          <li className="border-b pb-2">
            [공지] 5월 정기 점검 안내 – 5월 22일(수)
          </li>
          <li className="border-b pb-2">[업데이트] 팀별 KPI 공유 기능 추가</li>
          <li className="border-b pb-2">
            [이벤트] 전사 워크샵 일정 설문 (~5/20)
          </li>
        </ul>
        <div className="text-right mt-2">
          <Link
            to="/notice/global"
            className="text-sm text-blue-600 hover:underline"
          >
            전체 공지 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
