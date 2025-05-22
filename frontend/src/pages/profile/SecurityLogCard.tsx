export default function SecurityLogCard() {
  return (
    <div className="bg-white p-6 rounded-lg border text-sm">
      <h3 className="font-semibold mb-3">🛡 보안 / 활동 로그</h3>
      <ul className="space-y-1">
        <li>
          최근 로그인: <strong>2025-05-22 13:58</strong>
        </li>
        <li>
          접속 브라우저: <strong>Chrome</strong>
        </li>
        <li>
          IP 주소: <strong>192.168.0.1</strong>
        </li>
      </ul>
    </div>
  );
}
