// utils/time.js

// 1. KST 기준 Date 객체 반환
const getKstDate = (date = new Date()) => {
  const offset = 9 * 60 * 60 * 1000;
  return new Date(date.getTime() + offset);
};

// 2. SQLite DATETIME 포맷으로 변환 (YYYY-MM-DD HH:mm:ss)
const formatToKstString = (date = new Date()) => {
  return getKstDate(date).toISOString().replace("T", " ").slice(0, 19);
};

// 3. ISO 형식 KST (단순 참고용, DB에는 사용 X)
const formatKstAsISO = (date = new Date()) => {
  return getKstDate(date).toISOString(); // still ends with "Z" but time shifted
};

// 4. 분리된 KST 날짜 컴포넌트
const getKstNowComponents = () => {
  const kst = getKstDate();
  return {
    year: kst.getFullYear(),
    month: kst.getMonth() + 1,
    date: kst.getDate(),
    hour: kst.getHours(),
    minute: kst.getMinutes(),
    second: kst.getSeconds(),
  };
};

module.exports = {
  getKstDate,
  formatToKstString,
  formatKstAsISO,
  getKstNowComponents,
};
