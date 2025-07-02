/**
 * 팀별공유 게시판 메인 페이지
 * 팀별 게시판의 게시글 목록, 작성, 상세보기 기능을 제공
 * 
 * 설계 의사결정:
 * - 단일 페이지에서 모든 팀별 게시판 기능 통합 관리
 * - 상태 기반 UI 전환으로 사용자 경험 개선
 * - 팀 정보 기반 접근 제어로 보안 강화
 * - 실시간 데이터 동기화로 최신 정보 제공
 * - 에러 처리와 로딩 상태 관리
 * - 팀별 게시글만 표시하여 팀 내 소통 공간 제공
 */
import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import PostList from "../../components/board/PostList";
import PostDetail from "../../components/board/PostDetail";
import PostForm from "../../components/board/PostForm";
import { 
  getTeamBoardPosts, 
  getTeamBoardPostById,
  createTeamBoardPost
} from "../../services/boardService";
import { handleApiError } from "../../utils/handleErrorFront";
import type { BoardPost, BoardPostRequest, PaginationInfo } from "../../types/board";
import { useUser } from "../../contexts/useUser";

const Team = () => {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>();
  const [searchType, setSearchType] = useState<'title' | 'author'>('title');
  const [searchKeyword, setSearchKeyword] = useState("");
  const [teamCode, setTeamCode] = useState<string>("");

  const location = useLocation();
  const user = useUser();
  const canWrite = user !== null;
  
  // 디버깅: 사용자 정보 확인
  console.log('현재 사용자 정보:', user);

  const fetchPosts = useCallback(async (currentPage: number, search?: { title?: string; author?: string }) => {
    try {
      setIsLoading(true);
      console.log('팀별 게시글 목록 조회 시작...'); // 디버깅
      const data = await getTeamBoardPosts(currentPage, 20, search);
      console.log('팀별 게시글 목록 조회 성공:', data); // 디버깅
      
      // 각 게시글에 type 필드가 없으면 TEAM으로 설정
      const postsWithType = data.posts.map(post => ({
        ...post,
        type: post.type || 'TEAM'
      }));
      
      setPosts(postsWithType);
      setTeamCode(data.teamCode);
      setPagination(data.pagination);
    } catch (err) {
      console.error('팀별 게시글 목록 조회 실패:', err); // 디버깅
      handleApiError(err, "팀별 게시글 목록을 불러오는데 실패했습니다.");
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
      console.log('게시글 클릭:', post.id); // 디버깅
      const freshPost = await getTeamBoardPostById(post.id);
      console.log('게시글 상세 조회 결과:', freshPost); // 디버깅
      setSelectedPost(freshPost);
      setView("detail");
    } catch (err) {
      console.error('게시글 상세 조회 실패:', err); // 디버깅
      handleApiError(err, "게시글을 불러오는데 실패했습니다.");
    }
  };

  const handleCreatePost = async (postData: BoardPostRequest) => {
    try {
      setIsSubmitting(true);
      await createTeamBoardPost(postData);
      
      // 게시글 작성 성공 후 첨부파일 연결 처리
      // (백엔드에서 자동으로 처리되므로 별도 로직 불필요)
      
      setView("list");
      setPage(1);
      fetchPosts(1);
    } catch (err) {
      handleApiError(err, "게시글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedPost(null);
  };

  const handleSearch = () => {
    const search = searchKeyword.trim() ? { [searchType]: searchKeyword.trim() } : undefined;
    setPage(1);
    fetchPosts(1, search);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const lastSearch = searchKeyword.trim() ? { [searchType]: searchKeyword.trim() } : undefined;

  const renderHeader = () => {
    let title = "팀별공유 게시판";
    let subtitle = `팀 ${teamCode}의 자료와 정보를 공유하세요.`;

    if (view === 'create') {
        title = "새 팀 게시글 작성";
        subtitle = "팀원들과 공유할 내용을 작성하세요.";
    } else if (view === 'detail' && selectedPost) {
        title = "팀 게시글 상세";
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
  };

  const renderSearchBar = () => {
    if (view !== "list") return null;

    return (
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'title' | 'author')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="title">제목</option>
              <option value="author">작성자</option>
            </select>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={`${searchType === 'title' ? '제목' : '작성자'}으로 검색`}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-64"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            검색
          </button>
          {searchKeyword && (
            <button
              onClick={() => {
                setSearchKeyword("");
                setPage(1);
                fetchPosts(1);
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (view === "create") {
      return (
        <PostForm
          mode="create"
          onSubmit={handleCreatePost}
          onCancel={handleBackToList}
          isSubmitting={isSubmitting}
        />
      );
    }

    if (view === "detail" && selectedPost) {
      return (
        <PostDetail
          post={selectedPost}
          onBack={handleBackToList}
        />
      );
    }

    return (
      <PostList
        notices={[]}
        posts={posts}
        onPostClick={handlePostClick}
        pagination={pagination}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {renderHeader()}
      {renderSearchBar()}
      {renderContent()}
    </div>
  );
};

export default Team;
