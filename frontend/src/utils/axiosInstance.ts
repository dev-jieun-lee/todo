import axios from "axios";
import { getAccessToken, updateTokenEverywhere } from "./tokenManager";
import { logEvent } from "./logger"; // logEvent는 콘솔 기반 또는 파일 로그 함수
import { toast } from "react-toastify";

// axios 인스턴스 생성
const api = axios.create({
  baseURL: "/api", // 모든 요청에 자동으로 /api 접두사 추가
  withCredentials: true,
});

// 요청 인터셉터: Authorization 헤더 설정
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(
    "📤 요청 보내기:",
    config.method?.toUpperCase(),
    config.url,
    config.headers.Authorization
  );
  return config;
});

// 응답 인터셉터: 401 → 토큰 재발급 → 요청 재시도
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    console.warn("📛 응답 에러:", error.response?.status, originalRequest.url);

    // 1. Access Token 만료 → 재발급 시도
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/refresh")
    ) {
      originalRequest._retry = true;

      try {
        logEvent("🔄 Access Token 재발급 시도");
        const res = await api.post(
          "/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = res.data.token;

        updateTokenEverywhere(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        logEvent("✅ Access Token 재발급 성공 → 요청 재시도");

        return api(originalRequest);
      } catch (err) {
        logEvent(`❌ Access Token 재발급 실패: ${String(err)}`);
        localStorage.removeItem("auth");
        window.location.href = "/login";
      }
    }

    // 2. 유효하지 않은 토큰 → 403 처리
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === "유효하지 않은 토큰입니다."
    ) {
      toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
      localStorage.removeItem("auth");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
