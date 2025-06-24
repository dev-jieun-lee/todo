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
import React from "react";
import type { BoardPost, PaginationInfo } from "../../types/board";

interface PostListProps {
  notices: BoardPost[];
  posts: BoardPost[];
  onPostClick: (post: BoardPost) => void;
  isLoading?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
}

const PostList: React.FC<PostListProps> = ({
  notices,
  posts,
  onPostClick,
  isLoading = false,
  pagination,
  onPageChange,
}) => {
  // 날짜 포맷 (YYYY.MM.DD HH:mm)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  };

  // 한 줄 리스트 행 렌더링
  const renderRow = (post: BoardPost, isNotice: boolean = false) => (
    <div
      key={post.id}
      className={`flex items-center px-3 py-2 border-b text-sm cursor-pointer transition hover:bg-blue-50 ${isNotice ? 'bg-gradient-to-r from-red-50 to-orange-50 font-semibold text-red-700' : 'bg-white text-gray-800'}`}
      onClick={() => onPostClick(post)}
      style={{ minHeight: 44 }}
    >
      {/* 구분: 공지/번호 */}
      <div className="w-14 flex-shrink-0 flex flex-col items-center justify-center text-xs">
        {isNotice ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-500 text-white text-xs font-bold">공지</span>
        ) : (
          <span className="text-gray-500 font-normal">{post.id}</span>
        )}
      </div>
      {/* 제목 (한 줄, ... 처리) */}
      <div className="flex-1 truncate">
        <span className="truncate inline-block align-middle max-w-[90%]">
          {post.title}
        </span>
        {(post.comment_count || 0) > 0 && (
          <span className="ml-1 text-blue-600 font-semibold align-middle">[{post.comment_count || 0}]</span>
        )}
      </div>
      {/* 작성자 */}
      <div className="w-28 text-center text-gray-500 truncate hidden md:block">{post.author?.name || post.author_name || "익명"}</div>
      {/* 날짜 */}
      <div className="w-32 text-center text-gray-400 hidden md:block whitespace-nowrap truncate">{formatDate(post.createdAt || post.created_at)}</div>
      {/* 조회수 */}
      <div className="w-16 text-center text-gray-400 flex items-center justify-center gap-1">
        <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        {post.view_count || 0}
      </div>
    </div>
  );

  // 페이지네이션 버튼 렌더링
  const renderPagination = () => {
    if (!pagination || pagination.total <= 1) return null;
    const { current, total, hasPrev, hasNext } = pagination;
    const pageNumbers = [];
    for (let i = 1; i <= total; i++) {
      pageNumbers.push(i);
    }
    return (
      <div className="flex justify-center items-center gap-1 py-3 bg-white border-t">
        <button
          className="px-2 py-1 text-sm rounded disabled:text-gray-300"
          disabled={!hasPrev}
          onClick={() => onPageChange && onPageChange(current - 1)}
        >이전</button>
        {pageNumbers.map(num => (
          <button
            key={num}
            className={`px-2 py-1 text-sm rounded ${num === current ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-100'}`}
            onClick={() => onPageChange && onPageChange(num)}
            disabled={num === current}
          >{num}</button>
        ))}
        <button
          className="px-2 py-1 text-sm rounded disabled:text-gray-300"
          disabled={!hasNext}
          onClick={() => onPageChange && onPageChange(current + 1)}
        >다음</button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="divide-y">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-11 bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden bg-white">
      {/* 헤더 */}
      <div className="flex items-center px-3 py-2 border-b bg-gray-50 text-xs text-gray-500 font-bold">
        <div className="w-14 text-center">구분</div>
        <div className="flex-1">제목</div>
        <div className="w-28 text-center hidden md:block">작성자</div>
        <div className="w-32 text-center hidden md:block">날짜</div>
        <div className="w-16 text-center">조회</div>
      </div>
      {/* 공지사항 */}
      {notices.length > 0 && notices.map(post => renderRow(post, true))}
      {/* 일반글 */}
      {posts.length > 0 ? (
        posts.map(post => renderRow(post, false))
      ) : (
        <div className="px-3 py-8 text-center text-gray-400">게시글이 없습니다.</div>
      )}
      {renderPagination()}
    </div>
  );
};

export default PostList; 