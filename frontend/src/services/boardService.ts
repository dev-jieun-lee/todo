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
  BoardPostsResponse, 
  BoardPostRequest,
  BoardType 
} from "../types/board";

// ===== 통합 게시판 서비스 =====

/**
 * 모든 게시글 목록 조회 (자유게시판 + 공지사항)
 * @param page - 페이지 번호 (기본값: 1)
 * @param limit - 페이지당 게시글 수 (기본값: 100)
 * @returns 모든 게시글 목록
 */
export const getAllBoardPosts = async (
  page: number = 1, 
  limit: number = 100
): Promise<BoardPostsResponse> => {
  try {
    // 자유게시판과 공지사항을 모두 가져와서 합치기
    const [freeResponse, noticeResponse] = await Promise.all([
      getFreeBoardPosts(page, limit),
      getNoticeBoardPosts(page, limit)
    ]);
    
    // 공지사항을 먼저, 그 다음 자유게시판 순으로 정렬
    const allPosts = [...noticeResponse.posts, ...freeResponse.posts];
    const totalPosts = freeResponse.pagination.totalPosts + noticeResponse.pagination.totalPosts;
    
    return {
      posts: allPosts,
      pagination: {
        current: page,
        total: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNext: allPosts.length >= limit,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error("통합 게시판 목록 조회 실패:", error);
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
    // 게시글 타입에 따라 다른 엔드포인트 사용
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
    // 게시글 타입에 따라 다른 엔드포인트 사용
    const response = await api.delete(`/boards/free/${id}`);
    return response.data;
  } catch (error) {
    console.error("게시글 삭제 실패:", error);
    throw new Error("게시글 삭제에 실패했습니다.");
  }
};

// ===== 자유게시판 API =====

/**
 * 자유게시판 게시글 목록 조회
 * @param page - 페이지 번호 (기본값: 1)
 * @param limit - 페이지당 게시글 수 (기본값: 10)
 * @returns 게시글 목록과 페이지네이션 정보
 */
export const getFreeBoardPosts = async (
  page: number = 1, 
  limit: number = 10
): Promise<BoardPostsResponse> => {
  try {
    const response = await api.get(`/boards/free?page=${page}&limit=${limit}&includeCommentCount=true`);
    return response.data;
  } catch (error) {
    console.error("자유게시판 목록 조회 실패:", error);
    throw new Error("게시글 목록을 불러오는데 실패했습니다.");
  }
};

/**
 * 자유게시판 게시글 상세 조회
 * @param id - 게시글 ID
 * @returns 게시글 상세 정보
 */
export const getFreeBoardPost = async (id: number): Promise<BoardPost> => {
  try {
    const response = await api.get(`/boards/free/${id}`);
    return response.data;
  } catch (error) {
    console.error("자유게시판 상세 조회 실패:", error);
    throw new Error("게시글을 불러오는데 실패했습니다.");
  }
};

/**
 * 자유게시판 게시글 작성
 * @param postData - 게시글 작성 데이터
 * @returns 생성된 게시글 정보
 */
export const createFreeBoardPost = async (
  postData: BoardPostRequest
): Promise<BoardPost> => {
  try {
    const response = await api.post("/boards/free", postData);
    return response.data;
  } catch (error) {
    console.error("자유게시판 작성 실패:", error);
    throw new Error("게시글 작성에 실패했습니다.");
  }
};

/**
 * 자유게시판 게시글 수정
 * @param id - 게시글 ID
 * @param postData - 수정할 게시글 데이터
 * @returns 수정 완료 메시지
 */
export const updateFreeBoardPost = async (
  id: number, 
  postData: BoardPostRequest
): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/boards/free/${id}`, postData);
    return response.data;
  } catch (error) {
    console.error("자유게시판 수정 실패:", error);
    throw new Error("게시글 수정에 실패했습니다.");
  }
};

/**
 * 자유게시판 게시글 삭제
 * @param id - 게시글 ID
 * @returns 삭제 완료 메시지
 */
export const deleteFreeBoardPost = async (
  id: number
): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/boards/free/${id}`);
    return response.data;
  } catch (error) {
    console.error("자유게시판 삭제 실패:", error);
    throw new Error("게시글 삭제에 실패했습니다.");
  }
};

// ===== 공지사항 API =====

/**
 * 공지사항 게시글 목록 조회
 * @param page - 페이지 번호 (기본값: 1)
 * @param limit - 페이지당 게시글 수 (기본값: 10)
 * @returns 공지사항 목록과 페이지네이션 정보
 */
export const getNoticeBoardPosts = async (
  page: number = 1, 
  limit: number = 10
): Promise<BoardPostsResponse> => {
  try {
    const response = await api.get(`/boards/notice?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("공지사항 목록 조회 실패:", error);
    throw new Error("공지사항 목록을 불러오는데 실패했습니다.");
  }
};

/**
 * 공지사항 게시글 상세 조회
 * @param id - 공지사항 ID
 * @returns 공지사항 상세 정보
 */
export const getNoticeBoardPost = async (id: number): Promise<BoardPost> => {
  try {
    const response = await api.get(`/boards/notice/${id}`);
    return response.data;
  } catch (error) {
    console.error("공지사항 상세 조회 실패:", error);
    throw new Error("공지사항을 불러오는데 실패했습니다.");
  }
};

/**
 * 공지사항 게시글 작성
 * @param postData - 공지사항 작성 데이터
 * @returns 생성된 공지사항 정보
 */
export const createNoticeBoardPost = async (
  postData: BoardPostRequest
): Promise<BoardPost> => {
  try {
    const response = await api.post("/boards/notice", postData);
    return response.data;
  } catch (error: unknown) {
    console.error("공지사항 작성 실패:", error);
    if (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'status' in error.response) {
      if (error.response.status === 403) {
        throw new Error("공지사항 작성 권한이 없습니다. 팀장 이상 권한이 필요합니다.");
      }
    }
    throw new Error("공지사항 작성에 실패했습니다.");
  }
};

/**
 * 공지사항 게시글 수정
 * @param id - 공지사항 ID
 * @param postData - 수정할 공지사항 데이터
 * @returns 수정 완료 메시지
 */
export const updateNoticeBoardPost = async (
  id: number, 
  postData: BoardPostRequest
): Promise<{ message: string }> => {
  try {
    const response = await api.put(`/boards/notice/${id}`, postData);
    return response.data;
  } catch (error) {
    console.error("공지사항 수정 실패:", error);
    throw new Error("공지사항 수정에 실패했습니다.");
  }
};

/**
 * 공지사항 게시글 삭제
 * @param id - 공지사항 ID
 * @returns 삭제 완료 메시지
 */
export const deleteNoticeBoardPost = async (
  id: number
): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/boards/notice/${id}`);
    return response.data;
  } catch (error) {
    console.error("공지사항 삭제 실패:", error);
    throw new Error("공지사항 삭제에 실패했습니다.");
  }
};

// ===== 유틸리티 함수 =====

/**
 * 게시판 유형에 따른 API 함수 반환
 * @param boardType - 게시판 유형
 * @returns 해당 게시판의 API 함수들
 */
export const getBoardApi = (boardType: BoardType) => {
  if (boardType === "NOTICE") {
    return {
      getPosts: getNoticeBoardPosts,
      getPost: getNoticeBoardPost,
      createPost: createNoticeBoardPost,
      updatePost: updateNoticeBoardPost,
      deletePost: deleteNoticeBoardPost,
    };
  }
  
  return {
    getPosts: getFreeBoardPosts,
    getPost: getFreeBoardPost,
    createPost: createFreeBoardPost,
    updatePost: updateFreeBoardPost,
    deletePost: deleteFreeBoardPost,
  };
};

/**
 * 특정 게시글 상세 조회
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