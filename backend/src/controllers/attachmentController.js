/**
 * 첨부파일 컨트롤러
 * 게시글 첨부파일의 업로드, 다운로드, 삭제 기능을 담당
 * 
 * 설계 의사결정:
 * - 보안을 위한 파일 타입 및 크기 검증
 * - 고유한 파일명 생성으로 충돌 방지
 * - 데이터베이스와 파일 시스템 동기화
 * - 권한 기반 접근 제어
 */
const { dbGet, dbAll, dbRun } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS, LOG_ACTION_LABELS } = require("../utils/logActions");
const path = require("path");
const fs = require("fs");

/**
 * 첨부파일 업로드
 * @route POST /api/attachments/upload
 * @desc 게시글에 첨부파일을 업로드
 */
exports.uploadAttachment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "업로드할 파일이 없습니다." });
  }

  const { boardId } = req.body;
  const userId = req.user.id;

  if (!boardId) {
    return res.status(400).json({ error: "게시글 ID가 필요합니다." });
  }

  try {
    // 임시 boardId 처리 (음수인 경우)
    if (boardId < 0) {
      // 임시 ID인 경우 데이터베이스에 저장하고 나중에 실제 게시글 ID로 연결
      const result = await dbRun(
        `INSERT INTO board_attachments 
         (board_id, original_filename, stored_filename, file_path, file_size, mime_type, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          boardId,
          req.file.originalname,
          req.file.filename,
          req.file.path,
          req.file.size,
          req.file.mimetype,
          userId
        ]
      );

      const attachment = {
        id: result.lastID,
        board_id: boardId,
        original_filename: req.file.originalname,
        stored_filename: req.file.filename,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        created_at: new Date().toISOString()
      };

      logSystemAction(
        req,
        req.user,
        LOG_ACTIONS.FILE_UPLOAD,
        `임시 첨부파일 업로드: ${req.file.originalname} (임시 ID: ${boardId})`,
        "info"
      );

      return res.status(201).json(attachment);
    }

    // 실제 게시글 존재 여부 및 권한 확인
    const board = await dbGet(
      "SELECT created_by, type FROM boards WHERE id = ?",
      [boardId]
    );

    if (!board) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    // 팀별 게시판의 경우 같은 팀 사용자만 업로드 가능
    if (board.type === 'TEAM') {
      const userInfo = await dbGet(
        "SELECT team_code FROM users WHERE id = ?",
        [userId]
      );
      
      const boardTeamInfo = await dbGet(
        "SELECT team_code FROM boards WHERE id = ?",
        [boardId]
      );
      
      if (!userInfo || !boardTeamInfo || userInfo.team_code !== boardTeamInfo.team_code) {
        return res.status(403).json({ error: "같은 팀 사용자만 첨부파일을 업로드할 수 있습니다." });
      }
    } else {
      // 자유게시판/공지사항의 경우 작성자만 업로드 가능
      if (board.created_by !== userId) {
        return res.status(403).json({ error: "첨부파일 업로드 권한이 없습니다." });
      }
    }

    // 첨부파일 정보 저장
    const result = await dbRun(
      `INSERT INTO board_attachments 
       (board_id, original_filename, stored_filename, file_path, file_size, mime_type, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        boardId,
        req.file.originalname,
        req.file.filename,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        userId
      ]
    );

    const attachment = {
      id: result.lastID,
      board_id: boardId,
      original_filename: req.file.originalname,
      stored_filename: req.file.filename,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      created_at: new Date().toISOString()
    };

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.FILE_UPLOAD,
      `첨부파일 업로드: ${req.file.originalname}`,
      "info"
    );

    res.status(201).json(attachment);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.FILE_UPLOAD,
      `첨부파일 업로드 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "첨부파일 업로드 실패" });
  }
};

/**
 * 첨부파일 목록 조회
 * @route GET /api/attachments/:boardId
 * @desc 특정 게시글의 첨부파일 목록을 조회
 */
exports.getAttachments = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.id;

  try {
    // 게시글 정보 조회 (권한 확인용)
    const board = await dbGet(
      "SELECT type, team_code FROM boards WHERE id = ?",
      [boardId]
    );

    if (!board) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    }

    // 팀별 게시판의 경우 같은 팀 사용자만 조회 가능
    if (board.type === 'TEAM') {
      const userInfo = await dbGet(
        "SELECT team_code FROM users WHERE id = ?",
        [userId]
      );
      
      if (!userInfo || userInfo.team_code !== board.team_code) {
        return res.status(403).json({ error: "같은 팀 사용자만 첨부파일을 조회할 수 있습니다." });
      }
    }

    const attachments = await dbAll(
      `SELECT id, original_filename, file_size, mime_type, created_at 
       FROM board_attachments 
       WHERE board_id = ? 
       ORDER BY created_at ASC`,
      [boardId]
    );

    res.json(attachments);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.READ_FAIL,
      `첨부파일 목록 조회 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "첨부파일 목록 조회 실패" });
  }
};

/**
 * 첨부파일 다운로드
 * @route GET /api/attachments/download/:id
 * @desc 첨부파일을 다운로드
 */
exports.downloadAttachment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const attachment = await dbGet(
      `SELECT ba.*, b.type, b.team_code 
       FROM board_attachments ba
       JOIN boards b ON ba.board_id = b.id
       WHERE ba.id = ?`,
      [id]
    );

    if (!attachment) {
      return res.status(404).json({ error: "첨부파일을 찾을 수 없습니다." });
    }

    // 팀별 게시판의 경우 같은 팀 사용자만 다운로드 가능
    if (attachment.type === 'TEAM') {
      const userInfo = await dbGet(
        "SELECT team_code FROM users WHERE id = ?",
        [userId]
      );
      
      if (!userInfo || userInfo.team_code !== attachment.team_code) {
        return res.status(403).json({ error: "같은 팀 사용자만 첨부파일을 다운로드할 수 있습니다." });
      }
    }

    const filePath = attachment.file_path;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "파일이 존재하지 않습니다." });
    }

    // 다운로드 카운트 증가 (선택사항)
    await dbRun(
      "UPDATE board_attachments SET download_count = COALESCE(download_count, 0) + 1 WHERE id = ?",
      [id]
    );

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.FILE_DOWNLOAD,
      `첨부파일 다운로드: ${attachment.original_filename}`,
      "info"
    );

    res.download(filePath, attachment.original_filename);
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.FILE_DOWNLOAD,
      `첨부파일 다운로드 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "첨부파일 다운로드 실패" });
  }
};

/**
 * 첨부파일 삭제
 * @route DELETE /api/attachments/:id
 * @desc 첨부파일을 삭제 (작성자만 가능)
 */
exports.deleteAttachment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const attachment = await dbGet(
      `SELECT ba.*, b.created_by as board_creator, b.type, b.team_code 
       FROM board_attachments ba
       JOIN boards b ON ba.board_id = b.id
       WHERE ba.id = ?`,
      [id]
    );

    if (!attachment) {
      return res.status(404).json({ error: "첨부파일을 찾을 수 없습니다." });
    }

    // 팀별 게시판의 경우 같은 팀 사용자만 삭제 가능
    if (attachment.type === 'TEAM') {
      const userInfo = await dbGet(
        "SELECT team_code FROM users WHERE id = ?",
        [userId]
      );
      
      if (!userInfo || userInfo.team_code !== attachment.team_code) {
        return res.status(403).json({ error: "같은 팀 사용자만 첨부파일을 삭제할 수 있습니다." });
      }
    }

    // 권한 확인 (게시글 작성자 또는 첨부파일 업로더)
    if (attachment.board_creator !== userId && attachment.created_by !== userId) {
      return res.status(403).json({ error: "첨부파일 삭제 권한이 없습니다." });
    }

    // 파일 시스템에서 삭제
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    // 데이터베이스에서 삭제
    await dbRun("DELETE FROM board_attachments WHERE id = ?", [id]);

    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.FILE_DELETE,
      `첨부파일 삭제: ${attachment.original_filename}`,
      "info"
    );

    res.json({ message: "첨부파일이 삭제되었습니다." });
  } catch (err) {
    logSystemAction(
      req,
      req.user,
      LOG_ACTIONS.FILE_DELETE,
      `첨부파일 삭제 실패: ${err.message}`,
      "error"
    );
    res.status(500).json({ error: "첨부파일 삭제 실패" });
  }
}; 