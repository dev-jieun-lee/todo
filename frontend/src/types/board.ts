/**
 * 게시판 관련 타입 정의
 * 자유게시판과 공지사항의 게시글과 페이지네이션 정보를 정의
 * 
 * 설계 의사결정:
 * - 백엔드 API 응답 구조와 일치하도록 타입 정의
 * - 선택적 필드를 통해 유연한 데이터 처리
 * - 페이지네이션 정보를 별도 타입으로 분리하여 재사용성 향상
 * - 게시판 유형을 구분하여 타입 안전성 확보
 * - 첨부파일 정보를 포함한 완전한 게시글 타입 정의
 * - 댓글 및 대댓글 구조 지원
 */

// 게시판 유형 정의
export type BoardType = "FREE" | "NOTICE";

// 작성자 정보
export interface BoardAuthor {
  id: number;
  name: string;
  department_code?: string;
  position_code?: string;
}

// 첨부파일 정보
export interface BoardAttachment {
  id: number;
  board_id: number;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_by: number;
  created_at: string;
  download_count?: number;
}

// 댓글 정보
export interface BoardComment {
  id: number;
  board_id: number;
  parent_id?: number;
  content: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  department_code?: string;
  position_code?: string;
  replies?: BoardComment[];
}

// 게시글 기본 정보
export interface BoardPost {
  id: number;
  type: BoardType;
  title: string;
  content: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
  author_name?: string;
  department_code?: string;
  position_code?: string;
  // 새로운 필드들
  author: BoardAuthor;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  view_count?: number;
  commentCount: number;
  comment_count?: number;
  // 첨부파일 정보
  attachments?: BoardAttachment[];
  // 댓글 정보
  comments?: BoardComment[];
}

// 페이지네이션 정보
export interface PaginationInfo {
  current: number;
  total: number;
  totalPosts: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 게시글 목록 응답
export interface BoardPostsResponse {
  posts: BoardPost[];
  pagination: PaginationInfo;
}

// 게시글 작성/수정 요청
export interface BoardPostRequest {
  title: string;
  content: string;
  isNotice?: boolean;
}

// 게시글 작성/수정 폼 상태
export interface BoardPostFormState {
  title: string;
  content: string;
  isSubmitting: boolean;
}

// 첨부파일 업로드 요청
export interface AttachmentUploadRequest {
  boardId: number;
  file: File;
}

// 첨부파일 업로드 응답
export interface AttachmentUploadResponse {
  id: number;
  board_id: number;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

// 댓글 작성 요청
export interface CommentRequest {
  boardId: number;
  parentId?: number;
  content: string;
}

// 댓글 수정 요청
export interface CommentUpdateRequest {
  content: string;
}

// 사용자 권한 정보
export interface UserPermission {
  canWriteNotice: boolean;
  positionCode?: string;
  positionLabel?: string;
} 