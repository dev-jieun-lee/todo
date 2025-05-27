// hooks/useDateUtils.ts
import dayjs from "dayjs";

export function useDateUtils() {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = dayjs(dateStr);
    return `${d.year()}년 ${d.month() + 1}월 ${d.date()}일`;
  };

  const calculateDays = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    return dayjs(end).diff(dayjs(start), "day") + 1;
  };

  return { formatDate, calculateDays };
}
