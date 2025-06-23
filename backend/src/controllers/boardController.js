/**
 * 게시판 컨트롤러
 * 자유게시판과 공지사항의 게시글 CRUD 기능을 담당
 * 
 * 설계 의사결정:
 * - RESTful API 설계로 일관성 있는 엔드포인트 구성
 * - 작성자만 수정/삭제 가능하도록 권한 제어
 * - 팀장 이상 권한만 공지사항 작성 가능하도록 권한 체크
 * - 페이지네이션을 통한 대용량 데이터 처리 최적화
 * - 시스템 로그를 통한 사용자 활동 추적
 */
const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS, LOG_ACTION_LABELS } = require("../utils/logActions");
const { formatToKstString } = require("../utils/time");

/**
 * 팀장 이상 권한 체크 함수
 * @param positionCode - 사용자의 직급 코드
 * @returns 팀장 이상 권한 여부
 */
const hasManagerOrHigherPermission = (positionCode) => {
  const managerPositions = ['LEAD', 'DEPHEAD', 'DIR', 'EVP', 'CEO'];
  return managerPositions.includes(positionCode);
};

/**
 * 자유게시판 게시글 목록 조회
 * @route GET /api/boards/free
 * @desc 자유게시판의 게시글 목록을 최신순으로 조회 (페이지네이션 지원)
 */
exports.getFreeBoardPosts = async (req, res) => {
  const { page = 1, limit = 20, includeCommentCount, title, author } = req.query;
  const offset = (page - 1) * limit;
  try {
    // 공지사항 전체 조회 (항상 상단 고정)
    const notices = await dbAll(
      `SELECT b.*, u.name as author_name, u.department_code, u.position_code
       FROM boards b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.type = 'NOTICE'
       ORDER BY b.created_at DESC`
    );

    // 검색 조건 동적 생성
    let whereClause = "b.type = 'FREE'";
    const params = [];
    if (title) {
      whereClause += " AND b.title LIKE ?";
      params.push(`%${title}%`);
    }
    if (author) {
      whereClause += " AND IFNULL(u.name, '') LIKE ?";
      params.push(`%${author}%`);
    }

    // 일반글(공지 제외) 페이징
    let postsQuery = `
      SELECT b.*, u.name as author_name, u.department_code, u.position_code
    `;
    if (includeCommentCount === 'true') {
      postsQuery += `, (SELECT COUNT(*) FROM board_comments WHERE board_id = b.id) as comment_count `;
    }
    postsQuery += `
      FROM boards b
      LEFT JOIN users u ON b.created_by = u.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const posts = await dbAll(postsQuery, [...params, limit, offset]);

    // 전체 일반글 수 (검색 조건 반영)
    const countResult = await dbGet(
      `SELECT COUNT(*) as total FROM boards b LEFT JOIN users u ON b.created_by = u.id WHERE ${whereClause}`,
      params
    );
    const total = countResult.total;

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `자유게시판(공지+일반) 조회: 공지 ${notices.length}건, 일반 ${posts.length}건 (페이지: ${page})`,
      "info"
    );

    res.json({
      notices,
      posts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: offset + posts.length < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      `자유게시판(공지+일반) 조회 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "게시글 목록 조회 실패" });
  }
};

/**
 * 공지사항 게시글 목록 조회
 * @route GET /api/boards/notice
 * @desc 공지사항의 게시글 목록을 최신순으로 조회 (페이지네이션 지원)
 */
exports.getNoticeBoardPosts = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    // 전체 게시글 수 조회
    const countResult = await dbGet(
      "SELECT COUNT(*) as total FROM boards WHERE type = 'NOTICE'",
      []
    );
    const total = countResult.total;
    
    // 게시글 목록 조회 (작성자 정보 포함)
    const posts = await dbAll(
      `SELECT b.*, u.name as author_name, u.department_code, u.position_code
       FROM boards b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.type = 'NOTICE'
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `공지사항 조회: ${posts.length}건 (페이지: ${page})`,
      "info"
    );
    
    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: offset + posts.length < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      `공지사항 조회 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "공지사항 목록 조회 실패" });
  }
};

/**
 * 자유게시판 게시글 상세 조회
 * @route GET /api/boards/free/:id
 * @desc 특정 게시글의 상세 내용을 조회하고 조회수를 1 증가
 */
exports.getFreeBoardPost = async (req, res) => {
  const { id } = req.params;
  try {
    // 조회수 증가
    await dbRun("UPDATE boards SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?", [id]);

    // 게시글 조회
    const post = await dbGet(
      `SELECT b.*, u.name as author_name, u.department_code, u.position_code
       FROM boards b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.id = ? AND b.type = 'FREE'`,
      [id]
    );

    if (!post) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `게시글 상세 조회: ${post.title}`,
      "info"
    );

    res.json(post);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      `게시글 상세 조회 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "게시글 조회 실패" });
  }
};

/**
 * 공지사항 게시글 상세 조회
 * @route GET /api/boards/notice/:id
 * @desc 특정 공지사항의 상세 내용을 조회하고 조회수를 1 증가
 */
exports.getNoticeBoardPost = async (req, res) => {
  const { id } = req.params;
  try {
    // 조회수 증가
    await dbRun("UPDATE boards SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?", [id]);

    // 공지사항 조회
    const post = await dbGet(
      `SELECT b.*, u.name as author_name, u.department_code, u.position_code
       FROM boards b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.id = ? AND b.type = 'NOTICE'`,
      [id]
    );

    if (!post) {
      return res.status(404).json({ error: "공지사항을 찾을 수 없습니다." });
    }

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ,
      `공지사항 상세 조회: ${post.title}`,
      "info"
    );

    res.json(post);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      `공지사항 상세 조회 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "공지사항 조회 실패" });
  }
};

/**
 * 자유게시판 게시글 작성
 * @route POST /api/boards/free
 * @desc 새로운 게시글을 작성 (공지사항 옵션 지원)
 */
exports.createFreeBoardPost = async (req, res) => {
  const { title, content, isNotice = false } = req.body;
  const userId = req.user.id;
  
  // 입력값 검증
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "제목은 필수입니다." });
  }
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "내용은 필수입니다." });
  }
  
  try {
    // 공지사항으로 등록하려는 경우 권한 확인
    if (isNotice) {
      const userInfo = await dbGet(
        "SELECT position_code FROM users WHERE id = ?",
        [userId]
      );
      
      if (!userInfo || !hasManagerOrHigherPermission(userInfo.position_code)) {
        logSystemAction(
          req,
          req.user,
          LOG_ACTIONS.BOARD_POST_CREATE,
          `공지사항 작성 권한 없음: ${req.user.position_code}`,
          "warn"
        );
        return res.status(403).json({ 
          error: "공지사항 작성 권한이 없습니다. 팀장 이상 권한이 필요합니다." 
        });
      }
    }
    
    // 게시글 타입 결정
    const postType = isNotice ? "NOTICE" : "FREE";
    const createdAtKst = formatToKstString();
    const result = await dbRun(
      "INSERT INTO boards (type, title, content, created_by, created_at) VALUES (?, ?, ?, ?, ?)",
      [postType, title.trim(), content.trim(), userId, createdAtKst]
    );
    
    const newPost = {
      id: result.lastID,
      type: postType,
      title: title.trim(),
      content: content.trim(),
      created_by: userId,
      created_at: createdAtKst
    };
    
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_CREATE,
      `${isNotice ? '공지사항' : '게시글'} 작성: ${title}`,
      "info"
    );
    
    res.status(201).json(newPost);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_CREATE,
      `게시글 작성 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "게시글 작성 실패" });
  }
};

/**
 * 자유게시판 게시글 수정
 * @route PUT /api/boards/free/:id
 * @desc 작성자만 게시글을 수정할 수 있음
 */
exports.updateFreeBoardPost = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;
  
  // 입력값 검증
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "제목은 필수입니다." });
  }
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "내용은 필수입니다." });
  }
  
  try {
    // 게시글 존재 여부 및 작성자 확인
    const existingPost = await dbGet(
      "SELECT created_by FROM boards WHERE id = ? AND type = 'FREE'",
      [id]
    );
    
    if (!existingPost) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }
    
    if (existingPost.created_by !== userId) {
      return res.status(403).json({ error: "수정 권한이 없습니다." });
    }
    
    // 게시글 수정
    await dbRun(
      "UPDATE boards SET title = ?, content = ? WHERE id = ?",
      [title.trim(), content.trim(), id]
    );
    
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_EDIT,
      `${LOG_ACTION_LABELS.BOARD_POST_EDIT}: ${title}`,
      "info"
    );
    
    res.json({ message: "게시글이 수정되었습니다." });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_EDIT,
      `게시글 수정 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "게시글 수정 실패" });
  }
};

/**
 * 공지사항 게시글 수정
 * @route PUT /api/boards/notice/:id
 * @desc 작성자만 공지사항을 수정할 수 있음
 */
exports.updateNoticeBoardPost = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;
  
  // 입력값 검증
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "제목은 필수입니다." });
  }
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "내용은 필수입니다." });
  }
  
  try {
    // 게시글 존재 여부 및 작성자 확인
    const existingPost = await dbGet(
      "SELECT created_by FROM boards WHERE id = ? AND type = 'NOTICE'",
      [id]
    );
    
    if (!existingPost) {
      return res.status(404).json({ error: "공지사항을 찾을 수 없습니다." });
    }
    
    if (existingPost.created_by !== userId) {
      return res.status(403).json({ error: "수정 권한이 없습니다." });
    }
    
    // 게시글 수정
    await dbRun(
      "UPDATE boards SET title = ?, content = ? WHERE id = ?",
      [title.trim(), content.trim(), id]
    );
    
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_EDIT,
      `공지사항 수정: ${title}`,
      "info"
    );
    
    res.json({ message: "공지사항이 수정되었습니다." });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_EDIT,
      `공지사항 수정 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "공지사항 수정 실패" });
  }
};

/**
 * 자유게시판 게시글 삭제
 * @route DELETE /api/boards/free/:id
 * @desc 작성자만 게시글을 삭제할 수 있음
 */
exports.deleteFreeBoardPost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // 게시글 존재 여부 및 작성자 확인
    const existingPost = await dbGet(
      "SELECT title, created_by FROM boards WHERE id = ? AND type = 'FREE'",
      [id]
    );
    
    if (!existingPost) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }
    
    if (existingPost.created_by !== userId) {
      return res.status(403).json({ error: "삭제 권한이 없습니다." });
    }
    
    // 게시글 삭제
    await dbRun("DELETE FROM boards WHERE id = ?", [id]);
    
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_DELETE,
      `${LOG_ACTION_LABELS.BOARD_POST_DELETE}: ${existingPost.title}`,
      "info"
    );
    
    res.json({ message: "게시글이 삭제되었습니다." });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_DELETE,
      `게시글 삭제 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "게시글 삭제 실패" });
  }
};

/**
 * 공지사항 게시글 삭제
 * @route DELETE /api/boards/notice/:id
 * @desc 작성자만 공지사항을 삭제할 수 있음
 */
exports.deleteNoticeBoardPost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // 게시글 존재 여부 및 작성자 확인
    const existingPost = await dbGet(
      "SELECT title, created_by FROM boards WHERE id = ? AND type = 'NOTICE'",
      [id]
    );
    
    if (!existingPost) {
      return res.status(404).json({ error: "공지사항을 찾을 수 없습니다." });
    }
    
    if (existingPost.created_by !== userId) {
      return res.status(403).json({ error: "삭제 권한이 없습니다." });
    }
    
    // 게시글 삭제
    await dbRun("DELETE FROM boards WHERE id = ?", [id]);
    
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_DELETE,
      `공지사항 삭제: ${existingPost.title}`,
      "info"
    );
    
    res.json({ message: "공지사항이 삭제되었습니다." });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_DELETE,
      `공지사항 삭제 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "공지사항 삭제 실패" });
  }
};

/**
 * 공지사항 게시글 작성
 * @route POST /api/boards/notice
 * @desc 새로운 공지사항을 작성 (팀장 이상 권한 필요)
 */
exports.createNoticeBoardPost = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;
  
  // 입력값 검증
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "제목은 필수입니다." });
  }
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "내용은 필수입니다." });
  }
  
  try {
    // 사용자 권한 확인 (팀장 이상)
    const userInfo = await dbGet(
      "SELECT position_code FROM users WHERE id = ?",
      [userId]
    );
    
    if (!userInfo || !hasManagerOrHigherPermission(userInfo.position_code)) {
      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.BOARD_POST_CREATE,
        `공지사항 작성 권한 없음: ${req.user.position_code}`,
        "warn"
      );
      return res.status(403).json({ 
        error: "공지사항 작성 권한이 없습니다. 팀장 이상 권한이 필요합니다." 
      });
    }
    
    const result = await dbRun(
      "INSERT INTO boards (type, title, content, created_by) VALUES (?, ?, ?, ?)",
      ["NOTICE", title.trim(), content.trim(), userId]
    );
    
    const newPost = {
      id: result.lastID,
      type: "NOTICE",
      title: title.trim(),
      content: content.trim(),
      created_by: userId,
      created_at: new Date().toISOString()
    };
    
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_CREATE,
      `공지사항 작성: ${title}`,
      "info"
    );
    
    res.status(201).json(newPost);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.BOARD_POST_CREATE,
      `공지사항 작성 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "공지사항 작성 실패" });
  }
}; 