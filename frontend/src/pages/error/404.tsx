const Error404 = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
        페이지를 찾을 수 없습니다
      </h2>
      <p className="text-gray-600 mb-6">
        요청하신 주소에 해당하는 페이지가 존재하지 않거나 삭제되었습니다.
      </p>
      <a
        href="/"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        홈으로 돌아가기
      </a>
    </div>
  );
};

export default Error404;
