const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const syjeongId = 10;

const kpiSamples = [
  ['syjeong 월간 리포트 작성', 1, 0, '2024-07-10', '진행중'],
  ['syjeong 신규 프로젝트 런칭', 1, 0, '2024-08-01', '진행중'],
];

const todoSamples = [
  [syjeongId, 'syjeong 업무 보고서 제출', 0, '예정', '2024-07-05'],
  [syjeongId, 'syjeong 회의 준비', 0, '예정', '2024-07-03'],
];

function insertKpis() {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO kpis (title, target_value, current_value, due_date, status) VALUES (?, ?, ?, ?, ?)`;
    const stmt = db.prepare(sql);
    let count = 0;
    kpiSamples.forEach((kpi, idx) => {
      stmt.run(kpi, function(err) {
        if (err) {
          console.error('❌ KPI 샘플 추가 실패:', err.message);
        } else {
          count++;
        }
        if (idx === kpiSamples.length - 1) {
          stmt.finalize();
          resolve(count);
        }
      });
    });
  });
}

function insertTodos() {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO todos (user_id, title, is_done, status, due_date) VALUES (?, ?, ?, ?, ?)`;
    const stmt = db.prepare(sql);
    let count = 0;
    todoSamples.forEach((todo, idx) => {
      stmt.run(todo, function(err) {
        if (err) {
          console.error('❌ To-do 샘플 추가 실패:', err.message);
        } else {
          count++;
        }
        if (idx === todoSamples.length - 1) {
          stmt.finalize();
          resolve(count);
        }
      });
    });
  });
}

async function main() {
  try {
    const kpiCount = await insertKpis();
    const todoCount = await insertTodos();
    console.log(`✅ syjeong 샘플 KPI ${kpiCount}건, To-do ${todoCount}건 추가 완료!`);
  } catch (err) {
    console.error('❌ 샘플 데이터 추가 실패:', err.message);
  } finally {
    db.close();
  }
}

main(); 