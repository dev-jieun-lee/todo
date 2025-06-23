/**
 * 댓글 목록 컴포넌트
 * 게시글의 댓글과 대댓글을 표시하고 관리하는 컴포넌트
 * 
 * 설계 의사결정:
 * - 계층형 댓글 구조로 대댓글 지원
 * - 댓글 작성, 수정, 삭제 기능 제공
 * - 작성자만 수정/삭제 가능하도록 권한 제어
 * - 실시간 댓글 목록 업데이트
 * - 반응형 디자인으로 모바일 지원
 */
import React, { useState, useEffect } from 'react';
import type { BoardComment } from '../../types/board';
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment, 
  formatCommentDate 
} from '../../services/commentService';
import { useUser } from '../../contexts/useUser';

interface CommentListProps {
  boardId: number;
}

const CommentList: React.FC<CommentListProps> = ({ boardId }) => {
  const { id: userId } = useUser();
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  // 댓글 목록 로드
  useEffect(() => {
    loadComments();
  }, [boardId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentList = await getComments(boardId);
      setComments(commentList);
    } catch (error) {
      console.error('댓글 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 작성
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createComment({
        boardId,
        content: newComment.trim()
      });
      setNewComment('');
      loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    }
  };

  // 대댓글 작성
  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim()) return;

    try {
      await createComment({
        boardId,
        parentId,
        content: replyContent.trim()
      });
      setReplyContent('');
      setReplyingTo(null);
      loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('대댓글 작성 실패:', error);
      alert('대댓글 작성에 실패했습니다.');
    }
  };

  // 댓글 수정
  const handleUpdateComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    try {
      await updateComment(commentId, { content: editContent.trim() });
      setEditContent('');
      setEditingComment(null);
      loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment(commentId);
      loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 권한 확인
  const canEditComment = (comment: BoardComment) => {
    return userId === comment.created_by;
  };

  // 댓글 렌더링
  const renderComment = (comment: BoardComment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-4 mb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{comment.author_name}</span>
            {comment.department_code && (
              <span className="text-sm text-gray-500">({comment.department_code})</span>
            )}
            <span className="text-sm text-gray-400">{formatCommentDate(comment.created_at)}</span>
          </div>
          {canEditComment(comment) && (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEditingComment(comment.id);
                  setEditContent(comment.content);
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                수정
              </button>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                삭제
              </button>
            </div>
          )}
        </div>
        
        {editingComment === comment.id ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded-md resize-none"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleUpdateComment(comment.id)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                수정
              </button>
              <button
                onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
        )}
        
        {!isReply && (
          <button
            onClick={() => setReplyingTo(comment.id)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            답글
          </button>
        )}
      </div>

      {/* 대댓글 작성 폼 */}
      {replyingTo === comment.id && (
        <div className="ml-4 mb-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="대댓글을 입력하세요..."
            className="w-full p-2 border rounded-md resize-none"
            rows={3}
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => handleSubmitReply(comment.id)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              답글 작성
            </button>
            <button
              onClick={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 대댓글 목록 */}
      {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
    </div>
  );

  if (loading) {
    return <div className="text-center py-4">댓글을 불러오는 중...</div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 댓글 ({comments.length})</h3>
      
      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            댓글 작성
          </button>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">아직 댓글이 없습니다.</p>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
};

export default CommentList; 