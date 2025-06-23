const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const sqlPath = path.join(__dirname, 'database', 'comments.sql');

// SQL 파일 읽기
const sql = fs.readFileSync(sqlPath, 'utf8');

// 데이터베이스 연결 및 테이블 생성
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 실패:', err.message);
    return;
  }
  console.log('데이터베이스에 연결되었습니다.');

  db.exec(sql, (err) => {
    if (err) {
      console.error('테이블 생성 실패:', err.message);
    } else {
      console.log('board_comments 테이블이 성공적으로 생성되었습니다.');
    }
    
    // 데이터베이스 연결 종료
    db.close((err) => {
      if (err) {
        console.error('데이터베이스 연결 종료 실패:', err.message);
      } else {
        console.log('데이터베이스 연결이 종료되었습니다.');
      }
    });
  });
}); 