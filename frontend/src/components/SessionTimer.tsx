//세션 시간 실시간 표시
// src/components/SessionTimer.tsx
import { useEffect, useState } from "react";
import { getTokenRemainingTime } from "../utils/authUtils";
import { toast } from "react-toastify";

const formatTime = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

const SessionTimer = () => {
  const [remaining, setRemaining] = useState<number | null>(
    getTokenRemainingTime()
  );
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const time = getTokenRemainingTime();
      setRemaining(time);

      if (time !== null && time < 60 && !notified) {
        toast.warn("세션이 곧 만료됩니다. 자동 로그아웃 또는 재발급됩니다.");
        setNotified(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [notified]);

  if (remaining === null) return null;

  return (
    <span
      style={{ color: remaining < 300 ? "red" : "inherit", fontWeight: 600 }}
    >
      ⏰ {formatTime(remaining)} 남음
    </span>
  );
};

export default SessionTimer;
