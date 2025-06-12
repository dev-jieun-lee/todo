// src/contexts/CommonCodeContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { useUser } from "./useUser"; // 반드시 본인 구조에 맞게 import

export type CommonCodeMap = Record<string, { code: string; label: string }[]>;

const CommonCodeContext = createContext<CommonCodeMap>({});

export function useCommonCodeMap() {
  return useContext(CommonCodeContext);
}

// Provider 컴포넌트
export function CommonCodeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [commonCodeMap, setCommonCodeMap] = useState<CommonCodeMap>({});
  const { id: userId, token } = useUser(); // 로그인 정보, 구조 맞게 수정
  const CODE_GROUPS = [
    "DEPARTMENT",
    "POSITION",
    "VACATION_TYPE",
    "APPROVAL_ROUTE",
    "APPROVAL_TARGET",
    "APPROVAL_STATUS",
    // 필요 그룹 추가
  ];

  useEffect(() => {
    if (!userId || !token) return; // 로그인 전에는 fetch 금지

    let cancelled = false;

    const fetchAllCodes = async () => {
      const grouped: CommonCodeMap = {};
      await Promise.all(
        CODE_GROUPS.map((group) =>
          api.get(`/common-codes?group=${group}`).then((res) => {
            grouped[group] = res.data;
          })
        )
      );
      if (!cancelled) setCommonCodeMap(grouped);
    };

    fetchAllCodes();
    return () => {
      cancelled = true;
    };
  }, [userId, token]); // 로그인 정보가 바뀔 때만 fetch

  return (
    <CommonCodeContext.Provider value={commonCodeMap}>
      {children}
    </CommonCodeContext.Provider>
  );
}
