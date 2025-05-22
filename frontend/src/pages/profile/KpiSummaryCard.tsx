export default function KpiSummaryCard() {
  return (
    <div className="bg-white p-5 rounded-lg border text-sm">
      <h3 className="font-semibold mb-3">🎯 KPI 요약</h3>
      <ul className="space-y-1">
        <li>
          이번 달 제출률: <strong>80%</strong>
        </li>
        <li>
          미제출 KPI: <strong>1건</strong>
        </li>
        <li>
          다음 마감일: <strong>2025-05-31</strong>
        </li>
      </ul>
    </div>
  );
}
