/**
 * 게시판 서비스
 * 자유게시판과 공지사항 API 호출을 담당하는 서비스 함수들
 * 
 * 설계 의사결정:
 * - axios 인스턴스를 사용하여 일관된 API 호출
 * - 에러 처리를 통한 사용자 경험 개선
 * - 타입 안전성을 위한 TypeScript 인터페이스 활용
 * - 재사용 가능한 함수 구조로 유지보수성 향상
 * - 게시판 유형별로 함수를 분리하여 명확성 확보
 * - 통합된 게시판 서비스로 자유게시판과 공지사항 함께 관리
 */
import api from "../utils/axiosInstance";
import type { 
  BoardPost, 
  BoardPostRequest,
  PaginationInfo
} from "../types/board";

// ===== 통합 게시판 서비스 =====

/**
 * 모든 게시글 목록 조회 (자유게시판 + 공지사항)
 * @param page - 페이지 번호 (기본값: 1)
 * @param limit - 페이지당 게시글 수 (기본값: 20)
 * @param search - 검색 조건 (선택 가능한 파라미터: title, author)
 * @returns 공지사항과 일반글을 분리해서 반환
 */
export const getAllBoardPosts = async (
  page: number = 1,
  limit: number = 20,
  search?: { title?: string; author?: string }
): Promise<{ notices: BoardPost[]; posts: BoardPost[]; pagination: PaginationInfo }> => {
  try {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('includeCommentCount', 'true');
    if (search?.title) params.set('title', search.title);
    if (search?.author) params.set('author', search.author);
    const data = await api.get(`/boards/free?${params.toString()}`).then(r => r.data);
    return {
      notices: data.notices || [],
      posts: data.posts || [],
      pagination: data.pagination || {},
    };
  } catch (error) {
    console.error("게시판 목록 조회 실패:", error);
    throw new Error("게시글 목록을 불러오는데 실패했습니다.");
  }
};

/**
 * 게시글 작성 (공지사항 옵션 지원)
 * @param postData - 게시글 작성 데이터 (isNotice 옵션 포함)
 * @returns 생성된 게시글 정보
 */
export const createBoardPost = async (
  postData: BoardPostRequest
): Promise<BoardPost> => {
  try {
    const response = await api.post("/boards/free", postData);
    return response.data;
  } catch (error) {
    console.error("게시글 작성 실패:", error);
    throw new Error("게시글 작성에 실패했습니다.");
  }
};

/**
 * 게시글 수정
 * @param id - 게시글 ID
 * @param postData - 수정할 게시글 데이터
 * @returns 수정 완료 메시지
 */
export const updateBoardPost = async (
  id: number, 
  postData: BoardPostRequest
): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/boards/free/${id}`, postData);
    return response.data;
  } catch (error) {
    console.error("게시글 수정 실패:", error);
    throw new Error("게시글 수정에 실패했습니다.");
  }
};

/**
 * 게시글 삭제
 * @param id - 게시글 ID
 * @returns 삭제 완료 메시지
 */
export const deleteBoardPost = async (
  id: number
): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/boards/free/${id}`);
    return response.data;
  } catch (error) {
    console.error("게시글 삭제 실패:", error);
    throw new Error("게시글 삭제에 실패했습니다.");
  }
};

/**
 * 특정 게시글 상세 조회 (자유/공지 모두 지원)
 * @param postId - 조회할 게시글 ID
 * @param postType - 게시글 타입 ('FREE' 또는 'NOTICE')
 * @returns 게시글 상세 정보
 */
export const getBoardPostById = async (postId: number, postType: 'FREE' | 'NOTICE'): Promise<BoardPost> => {
  try {
    const boardTypePath = postType.toLowerCase();
    const response = await api.get(`/boards/${boardTypePath}/${postId}`);
    return response.data;
  } catch (error) {
    console.error("게시글 상세 조회 실패:", error);
    throw new Error("게시글을 불러오는데 실패했습니다.");
  }
}; 

