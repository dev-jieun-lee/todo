// 📬 공지 / 소통 > 공지사항

const Global = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">📢 공지사항</h2>
    <p className="text-gray-600">
      전체 사용자를 대상으로 등록되는 공지사항입니다.
    </p>

    {/* TODO: 공지 작성/수정/삭제 권한 처리 */}
    {/* TODO: 최신순 정렬 및 중요도 표시 */}
  </div>
);
export default Global;
