/**
 * 게시판 라우터
 * 자유게시판과 공지사항 관련 API 엔드포인트 정의
 * 
 * 설계 의사결정:
 * - RESTful API 설계로 일관성 있는 URL 구조
 * - 인증 미들웨어를 통한 보안 강화
 * - 명확한 HTTP 메서드 사용 (GET, POST, PUT, DELETE)
 * - 자유게시판과 공지사항을 구분하여 관리
 */
const express = require("express");
const router = express.Router();
const boardController = require("../controllers/boardController");
const authenticateToken = require("../middlewares/authMiddleware");

// 모든 게시판 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 자유게시판 라우트
router.get("/free", boardController.getFreeBoardPosts);           // 게시글 목록 조회
router.get("/free/:id", boardController.getFreeBoardPost);        // 게시글 상세 조회
router.post("/free", boardController.createFreeBoardPost);        // 게시글 작성
router.put("/free/:id", boardController.updateFreeBoardPost);     // 게시글 수정
router.delete("/free/:id", boardController.deleteFreeBoardPost);  // 게시글 삭제

// 공지사항 라우트
router.get("/notice", boardController.getNoticeBoardPosts);           // 공지사항 목록 조회
router.get("/notice/:id", boardController.getNoticeBoardPost);        // 공지사항 상세 조회
router.post("/notice", boardController.createNoticeBoardPost);        // 공지사항 작성 (팀장 이상 권한)
router.put("/notice/:id", boardController.updateNoticeBoardPost);     // 공지사항 수정
router.delete("/notice/:id", boardController.deleteNoticeBoardPost);  // 공지사항 삭제

module.exports = router; 