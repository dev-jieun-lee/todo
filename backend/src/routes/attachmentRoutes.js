/**
 * 첨부파일 라우터
 * 게시글 첨부파일 관련 API 엔드포인트 정의
 * 
 * 설계 의사결정:
 * - RESTful API 설계로 일관성 있는 URL 구조
 * - 인증 미들웨어를 통한 보안 강화
 * - 파일 업로드 미들웨어를 통한 파일 처리
 * - 명확한 HTTP 메서드 사용
 */
const express = require("express");
const router = express.Router();
const attachmentController = require("../controllers/attachmentController");
const { upload } = require("../middlewares/uploadMiddleware");
const authenticateToken = require("../middlewares/authMiddleware");

// 모든 첨부파일 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 첨부파일 라우트
router.post("/upload", upload.single('file'), attachmentController.uploadAttachment);  // 파일 업로드
router.get("/:boardId", attachmentController.getAttachments);                          // 첨부파일 목록 조회
router.get("/download/:id", attachmentController.downloadAttachment);                  // 첨부파일 다운로드
router.delete("/:id", attachmentController.deleteAttachment);                          // 첨부파일 삭제

module.exports = router; 