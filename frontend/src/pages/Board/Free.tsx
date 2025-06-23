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
import type { BoardPost, BoardPostRequest } from "../../types/board";
import { useUser } from "../../contexts/useUser";
import { hasManagerOrHigherPermission } from "../../utils/checkAccess";

const Free = () => {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const user = useUser();
  const canWrite = user !== null;
  const canWriteNotice = hasManagerOrHigherPermission(user?.position_code);

  const fetchPosts = useCallback(async (currentPage: number) => {
    try {
      setIsLoading(true);
      const data = await getAllBoardPosts(currentPage);
      setPosts(data.posts);
      setError(null);
    } catch (err) {
      handleApiError(err, "게시글 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "list") {
      fetchPosts(page);
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
       <div className="flex justify-between items-start mb-6">
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
    )
  }
  
  const renderContent = () => {
    if (view === 'list') {
      if (isLoading && posts.length === 0) return <div>로딩 중...</div>;
      if (error) return <div className="text-red-500">{error}</div>;

      return (
        <PostList
          posts={posts}
          onPostClick={handlePostClick}
          isLoading={isLoading}
        />
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
