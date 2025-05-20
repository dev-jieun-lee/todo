import api from "axios";
import { getAccessToken, updateTokenEverywhere } from "./tokenManager";

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const res = await api.post(
          "/api/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = res.data.token;

        updateTokenEverywhere(newToken); // 모든 상태에 토큰 반영
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error("❌ 토큰 재발급 실패:", err);
        // Refresh Token 만료 시 → 로그아웃 처리
        localStorage.removeItem("auth");
        window.location.href = "/login"; // 또는 navigate("/login")
      }
    }

    return Promise.reject(error);
  }
);
export default api;
