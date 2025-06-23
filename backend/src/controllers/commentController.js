/**
 * 댓글 컨트롤러
 * 게시글 댓글의 작성, 조회, 수정, 삭제 기능을 담당
 * 
 * 설계 의사결정:
 * - 계층형 댓글 구조 지원 (대댓글)
 * - 작성자만 수정/삭제 가능
 * - 게시글 삭제 시 연관 댓글도 삭제 (CASCADE)
 * - 실시간 댓글 목록 조회
 */
const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");

/**
 * 댓글 목록 조회
 * @route GET /api/comments/:boardId
 * @desc 특정 게시글의 댓글 목록을 조회 (계층형 구조)
 */
exports.getComments = async (req, res) => {
  const { boardId } = req.params;

  try {
    // 최상위 댓글 조회 (parent_id가 NULL인 것들)
    const topLevelComments = await dbAll(
      `SELECT c.*, u.name as author_name, u.department_code, u.position_code
       FROM board_comments c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.board_id = ? AND c.parent_id IS NULL
       ORDER BY c.created_at ASC`,
      [boardId]
    );

    // 각 최상위 댓글의 대댓글 조회
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await dbAll(
          `SELECT c.*, u.name as author_name, u.department_code, u.position_code
           FROM board_comments c
           LEFT JOIN users u ON c.created_by = u.id
           WHERE c.parent_id = ?
           ORDER BY c.created_at ASC`,
          [comment.id]
        );
        return {
          ...comment,
          replies
        };
      })
    );

    res.json(commentsWithReplies);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      `댓글 목록 조회 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "댓글 목록 조회 실패" });
  }
};

/**
 * 댓글 작성
 * @route POST /api/comments
 * @desc 새로운 댓글을 작성
 */
exports.createComment = async (req, res) => {
  const { boardId, parentId, content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "댓글 내용을 입력해주세요." });
  }

  try {
    // 게시글 존재 여부 확인
    const board = await dbGet(
      "SELECT id FROM boards WHERE id = ?",
      [boardId]
    );

    if (!board) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    // 대댓글인 경우 부모 댓글 존재 여부 확인
    if (parentId) {
      const parentComment = await dbGet(
        "SELECT id FROM board_comments WHERE id = ? AND board_id = ?",
        [parentId, boardId]
      );

      if (!parentComment) {
        return res.status(404).json({ error: "부모 댓글을 찾을 수 없습니다." });
      }
    }

    const result = await dbRun(
      "INSERT INTO board_comments (board_id, parent_id, content, created_by) VALUES (?, ?, ?, ?)",
      [boardId, parentId || null, content.trim(), userId]
    );

    // 생성된 댓글 정보 조회
    const newComment = await dbGet(
      `SELECT c.*, u.name as author_name, u.department_code, u.position_code
       FROM board_comments c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = ?`,
      [result.lastID]
    );

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.CREATE,
      `댓글 작성: ${content.substring(0, 50)}...`,
      "info"
    );

    res.status(201).json(newComment);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.CREATE_FAIL,
      `댓글 작성 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "댓글 작성 실패" });
  }
};

/**
 * 댓글 수정
 * @route PUT /api/comments/:id
 * @desc 작성자만 댓글을 수정할 수 있음
 */
exports.updateComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "댓글 내용을 입력해주세요." });
  }

  try {
    // 댓글 존재 여부 및 작성자 확인
    const comment = await dbGet(
      "SELECT created_by FROM board_comments WHERE id = ?",
      [id]
    );

    if (!comment) {
      return res.status(404).json({ error: "댓글을 찾을 수 없습니다." });
    }

    if (comment.created_by !== userId) {
      return res.status(403).json({ error: "수정 권한이 없습니다." });
    }

    // 댓글 수정
    await dbRun(
      "UPDATE board_comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [content.trim(), id]
    );

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.UPDATE,
      `댓글 수정: ${content.substring(0, 50)}...`,
      "info"
    );

    res.json({ message: "댓글이 수정되었습니다." });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.UPDATE_FAIL,
      `댓글 수정 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "댓글 수정 실패" });
  }
};

/**
 * 댓글 삭제
 * @route DELETE /api/comments/:id
 * @desc 작성자만 댓글을 삭제할 수 있음 (대댓글도 함께 삭제)
 */
exports.deleteComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 댓글 존재 여부 및 작성자 확인
    const comment = await dbGet(
      "SELECT created_by FROM board_comments WHERE id = ?",
      [id]
    );

    if (!comment) {
      return res.status(404).json({ error: "댓글을 찾을 수 없습니다." });
    }

    if (comment.created_by !== userId) {
      return res.status(403).json({ error: "삭제 권한이 없습니다." });
    }

    // 댓글 삭제 (대댓글도 함께 삭제됨 - CASCADE)
    await dbRun("DELETE FROM board_comments WHERE id = ?", [id]);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.DELETE,
      `댓글 삭제: ID ${id}`,
      "info"
    );

    res.json({ message: "댓글이 삭제되었습니다." });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.DELETE_FAIL,
      `댓글 삭제 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "댓글 삭제 실패" });
  }
}; 