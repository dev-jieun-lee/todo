export default function ScheduleSummaryCard() {
  return (
    <div className="bg-white p-5 rounded-lg border text-sm">
      <h3 className="font-semibold mb-3">📅 일정 요약</h3>
      <ul className="space-y-1">
        <li>
          오늘 회의/외근/교육: <strong>1건</strong>
        </li>
        <li>
          오늘 마감 TODO: <strong>2건</strong>
        </li>
        <li>
          이번 주 일정: <strong>4건</strong>
        </li>
      </ul>
    </div>
  );
}
