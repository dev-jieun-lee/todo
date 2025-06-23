/**
 * 게시글 목록 컴포넌트
 * 자유게시판의 게시글 목록을 표시하는 컴포넌트
 * 
 * 설계 의사결정:
 * - 공지사항을 상단에 고정 표시
 * - 자유게시판과 공지사항을 시각적으로 구분
 * - 페이지네이션으로 대량 데이터 처리
 * - 검색 기능으로 원하는 게시글 빠른 찾기
 * - 반응형 디자인으로 모바일 환경 지원
 * - 로딩 상태와 빈 상태 처리
 */
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import type { BoardPost } from "../../types/board";

interface PostListProps {
  posts: BoardPost[];
  onPostClick: (post: BoardPost) => void;
  onEditClick?: (post: BoardPost) => void;
  onDeleteClick?: (post: BoardPost) => void;
  canEdit?: (post: BoardPost) => boolean;
  canDelete?: (post: BoardPost) => boolean;
  isLoading?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  onPostClick,
  onEditClick,
  onDeleteClick,
  canEdit = () => false,
  canDelete = () => false,
  isLoading = false,
  searchTerm = "",
  onSearchChange,
}) => {
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // 게시글을 공지사항과 일반 게시글로 분리
  const { notices, regularPosts } = useMemo(() => {
    const notices = posts.filter(post => post.type === "NOTICE");
    const regularPosts = posts.filter(post => post.type === "FREE");
    return { notices, regularPosts };
  }, [posts]);

  // 검색어에 따른 필터링
  const filteredRegularPosts = useMemo(() => {
    if (!searchTerm.trim()) return regularPosts;
    
    const term = searchTerm.toLowerCase();
    return regularPosts.filter(post =>
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term) ||
      (post.author?.name || post.author_name || "").toLowerCase().includes(term)
    );
  }, [regularPosts, searchTerm]);

  // 현재 페이지의 게시글 계산
  const currentPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    return filteredRegularPosts.slice(startIndex, startIndex + postsPerPage);
  }, [filteredRegularPosts, currentPage]);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredRegularPosts.length / postsPerPage);

  /**
   * 날짜 포맷팅 함수
   * @param dateString - 날짜 문자열
   * @returns 포맷된 날짜 문자열
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else if (diffInHours < 168) { // 7일
      return `${Math.floor(diffInHours / 24)}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  /**
   * 게시글 카드 렌더링
   * @param post - 게시글 데이터
   * @param isNotice - 공지사항 여부
   * @returns 게시글 카드 JSX
   */
  const renderPostCard = (post: BoardPost, isNotice: boolean = false) => (
    <Card 
      key={post.id} 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isNotice 
          ? 'border-red-300 bg-red-50 hover:bg-red-100' 
          : 'hover:bg-gray-50'
      }`}
      onClick={() => onPostClick(post)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isNotice && (
                <Badge variant="destructive">
                  📢 공지사항
                </Badge>
              )}
              <h3 className={`font-medium truncate ${
                isNotice ? 'text-red-800' : 'text-gray-900'
              }`}>
                {post.title}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {post.content.replace(/<[^>]*>/g, '').substring(0, 100)}
              {post.content.length > 100 && '...'}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>{post.author?.name || post.author_name || "익명"}</span>
                <span>{formatDate(post.createdAt || post.created_at)}</span>
                {(post.updatedAt || post.updated_at) !== (post.createdAt || post.created_at) && (
                  <span className="text-blue-600">(수정됨)</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  {post.view_count || 0}
                </span>
                <span className="text-xs text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  {post.comment_count || 0}
                </span>
              </div>
            </div>
          </div>
          
          {/* 수정/삭제 버튼 */}
          {(canEdit(post) || canDelete(post)) && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {canEdit(post) && onEditClick && (
                <button
                  onClick={() => onEditClick(post)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="수정"
                >
                  ✏️
                </button>
              )}
              {canDelete(post) && onDeleteClick && (
                <button
                  onClick={() => onDeleteClick(post)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="삭제"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검색 기능 */}
      {onSearchChange && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="게시글 검색..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      )}

      {/* 공지사항 섹션 */}
      {notices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
            📢 공지사항
          </h3>
          <div className="space-y-3">
            {notices.map(post => renderPostCard(post, true))}
          </div>
        </div>
      )}

      {/* 일반 게시글 섹션 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          💬 자유게시판
          {searchTerm && (
            <span className="text-sm font-normal text-gray-500">
              (검색 결과: {filteredRegularPosts.length}개)
            </span>
          )}
        </h3>
        
        {currentPosts.length > 0 ? (
          <div className="space-y-3">
            {currentPosts.map(post => renderPostCard(post, false))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              {searchTerm ? "검색 결과가 없습니다." : "게시글이 없습니다."}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            이전
          </button>
          
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            const isCurrent = page === currentPage;
            
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm border rounded ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default PostList; 