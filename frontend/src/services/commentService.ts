/**
 * 댓글 서비스
 * 게시글 댓글의 작성, 조회, 수정, 삭제 API 호출을 담당
 * 
 * 설계 의사결정:
 * - axios 인스턴스를 사용하여 일관된 API 호출
 * - 계층형 댓글 구조 지원 (대댓글)
 * - 에러 처리를 통한 사용자 경험 개선
 * - 타입 안전성을 위한 TypeScript 인터페이스 활용
 */
import api from "../utils/axiosInstance";
import type { 
  BoardComment, 
  CommentRequest, 
  CommentUpdateRequest 
} from "../types/board";

/**
 * 댓글 목록 조회
 * @param boardId - 게시글 ID
 * @returns 댓글 목록 (계층형 구조)
 */
export const getComments = async (boardId: number): Promise<BoardComment[]> => {
  try {
    const response = await api.get(`/comments/${boardId}`);
    return response.data;
  } catch (error) {
    console.error("댓글 목록 조회 실패:", error);
    throw new Error("댓글 목록을 불러오는데 실패했습니다.");
  }
};

/**
 * 댓글 작성
 * @param commentData - 댓글 작성 데이터
 * @returns 생성된 댓글 정보
 */
export const createComment = async (commentData: CommentRequest): Promise<BoardComment> => {
  try {
    const response = await api.post('/comments', commentData);
    return response.data;
  } catch (error) {
    console.error("댓글 작성 실패:", error);
    throw new Error("댓글 작성에 실패했습니다.");
  }
};

/**
 * 댓글 수정
 * @param commentId - 댓글 ID
 * @param updateData - 수정할 내용
 * @returns 수정 완료 메시지
 */
export const updateComment = async (
  commentId: number, 
  updateData: CommentUpdateRequest
): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/comments/${commentId}`, updateData);
    return response.data;
  } catch (error) {
    console.error("댓글 수정 실패:", error);
    throw new Error("댓글 수정에 실패했습니다.");
  }
};

/**
 * 댓글 삭제
 * @param commentId - 댓글 ID
 * @returns 삭제 완료 메시지
 */
export const deleteComment = async (commentId: number): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error("댓글 삭제 실패:", error);
    throw new Error("댓글 삭제에 실패했습니다.");
  }
};

/**
 * 날짜 포맷팅
 * @param dateString - ISO 날짜 문자열
 * @returns 포맷된 날짜 문자열
 */
export const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}일 전`;
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 