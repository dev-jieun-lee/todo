import { useEffect, useMemo, useState } from "react";
import api from "../utils/axiosInstance";

export default function useCommonCodeMap(inputGroups: string[]) {
  const groups = useMemo(() => inputGroups, []); // 고정된 배열로 캐싱
  const [commonCodeMap, setCommonCodeMap] = useState<
    Record<string, { code: string; label: string }[]>
  >({});

  useEffect(() => {
    const fetchAll = async () => {
      const grouped: Record<string, { code: string; label: string }[]> = {};
      await Promise.all(
        groups.map((group) =>
          api.get(`/common-codes?group=${group}`).then((res) => {
            grouped[group] = res.data;
          })
        )
      );
      setCommonCodeMap(grouped);
    };

    fetchAll();
  }, [groups]); // groups가 고정된 배열이므로 무한루프 발생 안 함

  return { commonCodeMap };
}
