const Error403 = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
        접근 권한이 없습니다
      </h2>
      <p className="text-gray-600 mb-6">
        이 페이지에 접근할 수 있는 권한이 없습니다.
        <br />
        관리자에게 문의하거나 다른 메뉴를 이용해주세요.
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

export default Error403;
