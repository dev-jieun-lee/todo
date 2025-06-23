/**
 * 자유게시판 메인 페이지
 * 자유게시판의 게시글 목록, 작성, 상세보기 기능을 제공
 * 
 * 설계 의사결정:
 * - 단일 페이지에서 모든 게시판 기능 통합 관리
 * - 상태 기반 UI 전환으로 사용자 경험 개선
 * - 권한에 따른 기능 제한으로 보안 강화
 * - 실시간 데이터 동기화로 최신 정보 제공
 * - 에러 처리와 로딩 상태 관리
 * - 공지사항과 일반 게시글 통합 관리
 */
import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import PostList from "../../components/board/PostList";
import PostDetail from "../../components/board/PostDetail";
import PostForm from "../../components/board/PostForm";
import { 
  getAllBoardPosts, 
  getBoardPostById,
  createBoardPost
} from "../../services/boardService";
import { handleApiError } from "../../utils/handleErrorFront";
import type { BoardPost, BoardPostRequest, PaginationInfo } from "../../types/board";
import { useUser } from "../../contexts/useUser";
import { hasManagerOrHigherPermission } from "../../utils/checkAccess";

const Free = () => {
  const [notices, setNotices] = useState<BoardPost[]>([]);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>();
  const [searchType, setSearchType] = useState<'title' | 'author'>('title');
  const [searchKeyword, setSearchKeyword] = useState("");

  const location = useLocation();
  const user = useUser();
  const canWrite = user !== null;
  const canWriteNotice = hasManagerOrHigherPermission(user?.position_code);

  const fetchPosts = useCallback(async (currentPage: number, search?: { title?: string; author?: string }) => {
    try {
      setIsLoading(true);
      const data = await getAllBoardPosts(currentPage, 20, search);
      setNotices(data.notices);
      setPosts(data.posts);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      handleApiError(err, "게시글 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "list") {
      fetchPosts(page, lastSearch);
    }
  }, [page, view, fetchPosts]);

  useEffect(() => {
    if (location.state?.timestamp) {
      setSelectedPost(null);
      setView("list");
      setPage(1); 
    }
  }, [location.state]);

  const handlePostClick = async (post: BoardPost) => {
    try {
      const freshPost = await getBoardPostById(post.id, post.type);
      setSelectedPost(freshPost);
      setView("detail");
    } catch (err) {
      handleApiError(err, "게시글을 불러오는데 실패했습니다.");
    }
  };
  
  const handleSubmit = async (data: BoardPostRequest) => {
    try {
      setIsSubmitting(true);
      await createBoardPost(data);
      setView("list");
      setPage(1);
    } catch(err) {
      handleApiError(err, "게시글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleBackToList = () => {
    setSelectedPost(null);
    setView("list");
  };
  
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchObj = searchType === 'title'
      ? { title: searchKeyword.trim() || undefined }
      : { author: searchKeyword.trim() || undefined };
    setLastSearch(searchObj);
    setPage(1);
    fetchPosts(1, searchObj);
  };

  // 마지막 검색 조건을 기억하는 상태
  const [lastSearch, setLastSearch] = useState<{ title?: string; author?: string }>({});

  const renderHeader = () => {
    let title = "자유게시판";
    let subtitle = "팀원들과 자유롭게 소통하세요.";

    if (view === 'create') {
        title = "새 게시글 작성";
        subtitle = "자유롭게 의견을 나누어보세요.";
    } else if (view === 'detail' && selectedPost) {
        title = "게시글 상세";
        subtitle = selectedPost.title;
    }
    
    return (
       <div className="mb-6">
         <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">{subtitle}</p>
            </div>
            {view === "list" && canWrite ? (
               <button
                 onClick={() => setView("create")}
                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
               >
                 새 게시글 작성
               </button>
             ) : (view === "create" || view === "detail") && (
               <button
                  onClick={handleBackToList}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  목록으로
               </button>
             )}
         </div>
       </div>
    )
  }

  const renderSearchBox = () => (
    <div className="flex justify-end mb-4">
      <form className="flex gap-2 items-center" onSubmit={handleSearch}>
        <select
          value={searchType}
          onChange={e => setSearchType(e.target.value as 'title' | 'author')}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="title">제목</option>
          <option value="author">작성자</option>
        </select>
        <input
          type="text"
          placeholder={searchType === 'title' ? '제목 검색' : '작성자 검색'}
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-48"
        />
        <button
          type="submit"
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >검색</button>
      </form>
    </div>
  );

  const renderContent = () => {
    if (view === 'list') {
      if (isLoading && posts.length === 0) return <div>로딩 중...</div>;
      if (error) return <div className="text-red-500">{error}</div>;

      return (
        <>
          {renderSearchBox()}
          <PostList
            notices={notices}
            posts={posts}
            onPostClick={handlePostClick}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={setPage}
          />
        </>
      );
    }

    if (view === 'create') {
      return (
        <PostForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleBackToList}
          isSubmitting={isSubmitting}
          canWriteNotice={canWriteNotice}
        />
      );
    }

    if (view === 'detail' && selectedPost) {
      return (
        <PostDetail
          post={selectedPost}
          onBack={handleBackToList}
        />
      );
    }
    
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      {renderHeader()}
      {renderContent()}
    </div>
  );
};

export default Free;
