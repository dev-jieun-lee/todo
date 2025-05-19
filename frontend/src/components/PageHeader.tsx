import { useLocation, useNavigate } from "react-router-dom";
import React from "react";

type Crumb = {
  label: string;
  path?: string;
};

const routeCrumbs: Record<string, Crumb[]> = {
  "/todo/my": [{ label: "나의 실행 계획" }],
  "/todo/history": [
    { label: "나의 실행 계획", path: "/todo/my" },
    { label: "전체 TODO 이력" },
  ],
  "/kpi/team": [
    { label: "내 KPI 기록", path: "/kpi/my" },
    { label: "팀별 목표 설정" },
  ],
  "/kpi/summary": [
    { label: "내 KPI 기록", path: "/kpi/my" },
    { label: "KPI 달성 현황판" },
  ],
};

const PageHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const crumbs = routeCrumbs[location.pathname];

  if (!crumbs) return null;

  return (
    <div className="mb-6">
      <nav className="text-sm text-gray-600 mb-2">
        {crumbs.map((crumb, index) => (
          <span key={index}>
            {crumb.path ? (
              <button
                onClick={() => navigate(crumb.path!)}
                className="text-blue-600 hover:underline"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="font-semibold text-black">{crumb.label}</span>
            )}
            {index < crumbs.length - 1 && <span className="mx-1">›</span>}
          </span>
        ))}
      </nav>
      <h2 className="text-2xl font-bold">{crumbs[crumbs.length - 1].label}</h2>
    </div>
  );
};

export default PageHeader;
