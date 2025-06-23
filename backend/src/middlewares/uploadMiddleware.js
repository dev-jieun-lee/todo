/**
 * 파일 업로드 미들웨어
 * multer를 사용하여 파일 업로드를 처리
 * 
 * 설계 의사결정:
 * - 보안을 위해 허용된 파일 타입만 업로드 가능
 * - 파일 크기 제한으로 서버 리소스 보호
 * - 고유한 파일명 생성으로 충돌 방지
 * - 업로드 디렉토리 구조화
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../../uploads/board_attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 허용된 파일 타입
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed'
];

// 파일 확장자 매핑
const fileExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar'
};

// 파일 필터링
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('허용되지 않는 파일 타입입니다.'), false);
  }
};

// 저장소 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 고유한 파일명 생성 (timestamp + random + extension)
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const extension = fileExtensions[file.mimetype] || path.extname(file.originalname);
    const filename = `${timestamp}_${random}${extension}`;
    cb(null, filename);
  }
});

// multer 설정
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
    files: 5 // 최대 5개 파일
  }
});

module.exports = {
  upload,
  uploadDir,
  allowedMimeTypes
}; 