const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/database.sqlite');

console.log('=== 사용자 팀 정보 확인 ===');

// kimjj과 jung 사용자 정보 조회
db.all(
  "SELECT id, username, name, team_code, position_code FROM users WHERE username IN ('kimjj', 'jung')",
  (err, users) => {
    if (err) {
      console.error('사용자 조회 실패:', err);
      return;
    }
    
    console.log('사용자 정보:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, 사용자명: ${user.username}, 이름: ${user.name}, 팀: ${user.team_code}, 직급: ${user.position_code}`);
    });
    
    // 팀별 게시글 조회
    if (users.length > 0) {
      const teamCode = users[0].team_code;
      console.log(`\n팀 ${teamCode}의 게시글들:`);
      
      db.all(
        "SELECT id, title, created_by, created_at FROM boards WHERE type = 'TEAM' AND team_code = ? ORDER BY created_at DESC",
        [teamCode],
        (err, posts) => {
          if (err) {
            console.error('팀별 게시글 조회 실패:', err);
          } else {
            if (posts.length === 0) {
              console.log('팀별 게시글이 없습니다.');
            } else {
              posts.forEach((post, index) => {
                const author = users.find(u => u.id === post.created_by);
                console.log(`${index + 1}. ID: ${post.id}, 제목: ${post.title}, 작성자: ${author ? author.username : '알 수 없음'}, 작성일: ${post.created_at}`);
              });
            }
          }
          db.close();
        }
      );
    } else {
      db.close();
    }
  }
); 