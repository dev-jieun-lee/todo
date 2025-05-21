// 토큰 저장/동기화 담당

let accessToken: string | null = null;

// Context(UserProvider.tsx)의 setToken()을 받아 저장할 변수
let updateTokenInContext: ((newToken: string) => void) | null = null;

/**
 * 메모리 내 Access Token 설정
 */
export const setAccessToken = (token: string) => {
  accessToken = token;
};

/**
 * 메모리 내 Access Token 가져오기
 */
export const getAccessToken = () => accessToken;

/**
 * UserProvider에서 Context 갱신 함수 등록
 */
export const setUpdateTokenFunction = (fn: (newToken: string) => void) => {
  updateTokenInContext = fn;
};

/**
 * Access Token을 localStorage + Context + axios 메모리 내에 모두 반영
 */
export const updateTokenEverywhere = (newToken: string) => {
  // 1. axiosInstance.ts에서 사용할 메모리 내 토큰
  setAccessToken(newToken);

  // 2. localStorage의 token 업데이트
  const stored = localStorage.getItem("auth");
  if (stored) {
    const auth = JSON.parse(stored);
    auth.token = newToken;
    localStorage.setItem("auth", JSON.stringify(auth));
  }

  // 3. UserProvider의 Context 토큰 업데이트
  if (updateTokenInContext) {
    updateTokenInContext(newToken);
  }
};
