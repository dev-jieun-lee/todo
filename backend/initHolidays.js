const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// DB 파일 경로
const dbPath = path.join(__dirname, 'database', 'database.sqlite');

// DB 연결
const db = new sqlite3.Database(dbPath);

console.log('🎉 공휴일 데이터 초기화를 시작합니다...');

// holidays 테이블 생성
const createTableSQL = `
CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  is_recurring INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// 인덱스 생성
const createIndexSQL = `
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(year);
`;

// 공휴일 데이터
const holidaysData = [
  // 2024년
  ['2024-01-01', '신정', 2024, 1, 1, 1],
  ['2024-02-09', '설날', 2024, 2, 9, 0],
  ['2024-02-10', '설날', 2024, 2, 10, 0],
  ['2024-02-11', '설날', 2024, 2, 11, 0],
  ['2024-03-01', '삼일절', 2024, 3, 1, 1],
  ['2024-04-10', '제22대 국회의원선거', 2024, 4, 10, 0],
  ['2024-05-05', '어린이날', 2024, 5, 5, 1],
  ['2024-05-15', '부처님 오신 날', 2024, 5, 15, 0],
  ['2024-06-06', '현충일', 2024, 6, 6, 1],
  ['2024-08-15', '광복절', 2024, 8, 15, 1],
  ['2024-09-16', '추석', 2024, 9, 16, 0],
  ['2024-09-17', '추석', 2024, 9, 17, 0],
  ['2024-09-18', '추석', 2024, 9, 18, 0],
  ['2024-10-03', '개천절', 2024, 10, 3, 1],
  ['2024-10-09', '한글날', 2024, 10, 9, 1],
  ['2024-12-25', '크리스마스', 2024, 12, 25, 1],

  // 2025년
  ['2025-01-01', '신정', 2025, 1, 1, 1],
  ['2025-01-28', '설날', 2025, 1, 28, 0],
  ['2025-01-29', '설날', 2025, 1, 29, 0],
  ['2025-01-30', '설날', 2025, 1, 30, 0],
  ['2025-03-01', '삼일절', 2025, 3, 1, 1],
  ['2025-05-05', '어린이날', 2025, 5, 5, 1],
  ['2025-05-06', '어린이날 대체공휴일', 2025, 5, 6, 0],
  ['2025-05-15', '부처님 오신 날', 2025, 5, 15, 0],
  ['2025-06-06', '현충일', 2025, 6, 6, 1],
  ['2025-08-15', '광복절', 2025, 8, 15, 1],
  ['2025-10-03', '개천절', 2025, 10, 3, 1],
  ['2025-10-06', '추석', 2025, 10, 6, 0],
  ['2025-10-07', '추석', 2025, 10, 7, 0],
  ['2025-10-08', '추석', 2025, 10, 8, 0],
  ['2025-10-09', '한글날', 2025, 10, 9, 1],
  ['2025-12-25', '크리스마스', 2025, 12, 25, 1],

  // 2026년
  ['2026-01-01', '신정', 2026, 1, 1, 1],
  ['2026-02-16', '설날', 2026, 2, 16, 0],
  ['2026-02-17', '설날', 2026, 2, 17, 0],
  ['2026-02-18', '설날', 2026, 2, 18, 0],
  ['2026-03-01', '삼일절', 2026, 3, 1, 1],
  ['2026-05-05', '어린이날', 2026, 5, 5, 1],
  ['2026-05-24', '부처님 오신 날', 2026, 5, 24, 0],
  ['2026-06-06', '현충일', 2026, 6, 6, 1],
  ['2026-08-15', '광복절', 2026, 8, 15, 1],
  ['2026-09-24', '추석', 2026, 9, 24, 0],
  ['2026-09-25', '추석', 2026, 9, 25, 0],
  ['2026-09-26', '추석', 2026, 9, 26, 0],
  ['2026-10-03', '개천절', 2026, 10, 3, 1],
  ['2026-10-09', '한글날', 2026, 10, 9, 1],
  ['2026-12-25', '크리스마스', 2026, 12, 25, 1],

  // 2027년 (매년 반복되는 공휴일만)
  ['2027-01-01', '신정', 2027, 1, 1, 1],
  ['2027-03-01', '삼일절', 2027, 3, 1, 1],
  ['2027-05-05', '어린이날', 2027, 5, 5, 1],
  ['2027-06-06', '현충일', 2027, 6, 6, 1],
  ['2027-08-15', '광복절', 2027, 8, 15, 1],
  ['2027-10-03', '개천절', 2027, 10, 3, 1],
  ['2027-10-09', '한글날', 2027, 10, 9, 1],
  ['2027-12-25', '크리스마스', 2027, 12, 25, 1],

  // 2028년 (매년 반복되는 공휴일만)
  ['2028-01-01', '신정', 2028, 1, 1, 1],
  ['2028-03-01', '삼일절', 2028, 3, 1, 1],
  ['2028-05-05', '어린이날', 2028, 5, 5, 1],
  ['2028-06-06', '현충일', 2028, 6, 6, 1],
  ['2028-08-15', '광복절', 2028, 8, 15, 1],
  ['2028-10-03', '개천절', 2028, 10, 3, 1],
  ['2028-10-09', '한글날', 2028, 10, 9, 1],
  ['2028-12-25', '크리스마스', 2028, 12, 25, 1]
];

// 데이터 삽입 SQL
const insertSQL = `
INSERT OR IGNORE INTO holidays (date, name, year, month, day, is_recurring)
VALUES (?, ?, ?, ?, ?, ?)
`;

// 실행 함수
async function initHolidays() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 테이블 생성
      db.run(createTableSQL, (err) => {
        if (err) {
          console.error('❌ 테이블 생성 실패:', err.message);
          reject(err);
          return;
        }
        console.log('✅ holidays 테이블 생성 완료');

        // 인덱스 생성
        db.run(createIndexSQL, (err) => {
          if (err) {
            console.error('❌ 인덱스 생성 실패:', err.message);
            reject(err);
            return;
          }
          console.log('✅ 인덱스 생성 완료');

          // 기존 데이터 삭제 (중복 방지)
          db.run('DELETE FROM holidays', (err) => {
            if (err) {
              console.error('❌ 기존 데이터 삭제 실패:', err.message);
              reject(err);
              return;
            }
            console.log('✅ 기존 데이터 삭제 완료');

            // 새 데이터 삽입
            const stmt = db.prepare(insertSQL);
            let insertedCount = 0;

            holidaysData.forEach((holiday, index) => {
              stmt.run(holiday, function(err) {
                if (err) {
                  console.error(`❌ 데이터 삽입 실패 (${index + 1}번째):`, err.message);
                } else {
                  insertedCount++;
                }

                // 마지막 데이터 처리 완료 후
                if (index === holidaysData.length - 1) {
                  stmt.finalize((err) => {
                    if (err) {
                      console.error('❌ statement 정리 실패:', err.message);
                      reject(err);
                      return;
                    }
                    console.log(`✅ 공휴일 데이터 삽입 완료: ${insertedCount}건`);
                    resolve();
                  });
                }
              });
            });
          });
        });
      });
    });
  });
}

// 스크립트 실행
initHolidays()
  .then(() => {
    console.log('🎉 공휴일 데이터 초기화가 완료되었습니다!');
    db.close();
  })
  .catch((err) => {
    console.error('❌ 공휴일 데이터 초기화 실패:', err.message);
    db.close();
    process.exit(1);
  }); 