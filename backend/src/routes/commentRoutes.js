/**
 * 댓글 라우터
 * 게시글 댓글 관련 API 엔드포인트 정의
 * 
 * 설계 의사결정:
 * - RESTful API 설계로 일관성 있는 URL 구조
 * - 인증 미들웨어를 통한 보안 강화
 * - 계층형 댓글 구조 지원
 * - 명확한 HTTP 메서드 사용
 */
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const authenticateToken = require("../middlewares/authMiddleware");

// 모든 댓글 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 댓글 라우트
router.get("/:boardId", commentController.getComments);           // 댓글 목록 조회
router.post("/", commentController.createComment);                // 댓글 작성
router.put("/:id", commentController.updateComment);              // 댓글 수정
router.delete("/:id", commentController.deleteComment);           // 댓글 삭제

module.exports = router; 