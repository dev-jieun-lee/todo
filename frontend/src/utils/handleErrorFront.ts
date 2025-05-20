import axios from "axios";
import { toast } from "react-toastify";

/**
 * 프론트엔드 공통 API 에러 핸들러
 * - Axios, 일반 JS 에러, 네트워크 에러 등 모든 예외 처리
 * - 사용자에게 toast 메시지 안내
 * - 개발자용 콘솔 로그 제공
 *
 * @param err - unknown 형태의 예외 객체
 * @param fallbackMessage - 서버 응답이 없거나 에러 메시지가 없을 때 기본 안내 문구
 * @param options?.showToast - toast 출력 여부 (기본 true)
 * @param options?.consoleOnly - 콘솔만 출력하고 사용자에게는 안내하지 않음
 */
export const handleApiError = (
  err: unknown,
  fallbackMessage = "알 수 없는 오류가 발생했습니다.",
  options?: {
    showToast?: boolean;
    consoleOnly?: boolean;
  }
) => {
  const { showToast = true, consoleOnly = false } = options || {};
  let message = fallbackMessage;

  console.error("❌ API Error 발생:", err);

  try {
    // AxiosError
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;

      if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (status) {
        switch (status) {
          case 400:
            message = "잘못된 요청입니다.";
            break;
          case 401:
            message = "인증이 필요합니다. 다시 로그인해 주세요.";
            break;
          case 403:
            message = "접근 권한이 없습니다.";
            break;
          case 404:
            message = "요청한 리소스를 찾을 수 없습니다.";
            break;
          case 500:
            message = "서버 내부 오류가 발생했습니다.";
            break;
          default:
            message = `서버 오류가 발생했습니다. (코드: ${status})`;
        }
      } else if (err.request && !err.response) {
        message = "서버로부터 응답이 없습니다. 네트워크 상태를 확인해 주세요.";
      }
    }

    // 일반 JS 에러
    else if (err instanceof Error && err.message) {
      message = err.message;
    }

    // 그 외 문자열/숫자 에러
    else if (typeof err !== "object") {
      message = String(err);
    }
  } catch (e) {
    console.warn("⚠️ 에러 메시지 파싱 중 예외 발생:", e);
    message = fallbackMessage;
  }

  if (showToast && !consoleOnly) {
    toast.error(message);
  }
};
