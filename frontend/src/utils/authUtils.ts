import { getAccessToken } from "./tokenManager";
import { jwtDecode } from "jwt-decode";
export type DecodedToken = {
  exp: number;
  iat?: number;
  [key: string]: unknown;
};

/**
 * JWT Access Token을 안전하게 디코딩
 */
export const decodeToken = (): DecodedToken | null => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    return jwtDecode<DecodedToken>(token);
  } catch (err: unknown) {
    console.error("❌ 토큰 디코딩 실패:", err);
    return null;
  }
};
/**
 * 토큰 만료까지 남은 시간 (초)
 */
export const getTokenRemainingTime = (): number | null => {
  const decoded = decodeToken();
  if (!decoded || typeof decoded.exp !== "number") return null;

  const now = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - now;

  return remaining > 0 ? remaining : 0;
};

/**
 * 토큰이 만료되었는지 여부
 */
export const isTokenExpired = (): boolean => {
  const remaining = getTokenRemainingTime();
  return remaining === null || remaining <= 0;
};

/**
 * 토큰 만료 시각 (Date 객체 반환)
 */
export const getTokenExpiryDate = (): Date | null => {
  const decoded = decodeToken();
  if (!decoded || typeof decoded.exp !== "number") return null;

  return new Date(decoded.exp * 1000);
};

/**
 * 토큰 발급 시각 (Date 객체 반환)
 */
export const getTokenIssuedDate = (): Date | null => {
  const decoded = decodeToken();
  if (!decoded || typeof decoded.iat !== "number") return null;

  return new Date(decoded.iat * 1000);
};
