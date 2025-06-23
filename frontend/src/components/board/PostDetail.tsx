/**
 * 게시글 상세 보기 컴포넌트
 * 자유게시판의 게시글 상세 내용을 표시
 * 
 * 설계 의사결정:
 * - 깔끔한 레이아웃으로 가독성 향상
 * - 작성자 정보와 작성일을 명확히 표시
 * - 내용을 보기 좋게 포맷팅
 * - 뒤로가기 버튼으로 사용자 경험 개선
 * - 첨부파일 목록 표시 및 다운로드 기능
 * - 댓글 및 대댓글 기능 추가
 */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import type { BoardPost, BoardAttachment } from "../../types/board";
import { getAttachments } from "../../services/attachmentService";
import AttachmentList from "./AttachmentList";
import CommentList from "./CommentList";
import { useUser } from "../../contexts/useUser";

interface PostDetailProps {
  post: BoardPost;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const PostDetail: React.FC<PostDetailProps> = ({
  post,
  onBack,
  onEdit,
  onDelete,
}) => {
  const { id: currentUserId } = useUser();
  const [attachments, setAttachments] = useState<BoardAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);

  // 첨부파일 목록 로드
  useEffect(() => {
    const loadAttachments = async () => {
      try {
        const attachmentList = await getAttachments(post.id);
        setAttachments(attachmentList);
      } catch (error) {
        console.error('첨부파일 로드 실패:', error);
      } finally {
        setLoadingAttachments(false);
      }
    };

    loadAttachments();
  }, [post.id]);

  // 첨부파일 삭제 처리
  const handleAttachmentDeleted = (attachmentId: number) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  /**
   * 날짜 포맷팅 함수
   * @param dateString - ISO 날짜 문자열
   * @returns 포맷된 날짜 문자열
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * 내용을 줄바꿈을 유지하여 표시
   * @param content - 게시글 내용
   * @returns 줄바꿈이 적용된 JSX
   */
  const formatContent = (content: string): React.JSX.Element => {
    const lines = content.split('\n');
    return (
      <div className="whitespace-pre-wrap">
        {lines.map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          {/* 상단 버튼 영역 */}
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              목록으로 돌아가기
            </button>
            
            {/* 작성자만 수정/삭제 버튼 표시 */}
            {currentUserId === post.created_by && (
              <div className="flex gap-2">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                  >
                    수정
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {post.title}
          </h1>

          {/* 작성자 정보 */}
          <div className="flex items-center gap-4 text-sm text-gray-600 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">
                {post.author_name || "익명"}
              </span>
              {post.department_code && (
                <span className="text-gray-500">
                  ({post.department_code})
                </span>
              )}
            </div>
            <span>•</span>
            <span>{formatDate(post.created_at)}</span>
          </div>
        </CardHeader>

        <CardContent>
          {/* 게시글 내용 */}
          <div className="prose max-w-none">
            <div className="text-gray-800 leading-relaxed">
              {formatContent(post.content)}
            </div>
          </div>

          {/* 첨부파일 목록 */}
          {!loadingAttachments && (
            <AttachmentList
              attachments={attachments}
              boardCreatorId={post.created_by}
              onAttachmentDeleted={handleAttachmentDeleted}
            />
          )}

          {/* 하단 구분선 */}
          <div className="border-t border-gray-200 mt-8 pt-4">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>게시글 ID: {post.id}</span>
              <span>조회수: {post.view_count ?? 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 목록 */}
      <CommentList boardId={post.id} />
    </div>
  );
};

export default PostDetail; 