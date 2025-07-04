/**
 * 첨부파일 목록 컴포넌트
 * 게시글의 첨부파일 목록을 표시하고 다운로드/삭제 기능을 제공
 * 
 * 설계 의사결정:
 * - 파일 타입별 아이콘으로 시각적 구분
 * - 파일 크기 포맷팅으로 사용자 친화적 표시
 * - 권한에 따른 삭제 버튼 표시
 * - 다운로드 진행 상태 표시
 * - 반응형 디자인으로 모바일 지원
 */
import React, { useState } from 'react';
import type { BoardAttachment } from '../../types/board';
import { 
  downloadAttachment, 
  deleteAttachment, 
  formatFileSize, 
  getFileIcon 
} from '../../services/attachmentService';
import { useUser } from '../../contexts/useUser';

interface AttachmentListProps {
  attachments: BoardAttachment[];
  boardCreatorId: number;
  onAttachmentDeleted?: (attachmentId: number) => void;
}

const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  boardCreatorId,
  onAttachmentDeleted
}) => {
  const { id: userId } = useUser();
  const [downloadingFiles, setDownloadingFiles] = useState<Set<number>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set());

  // 디버깅: 첨부파일 정보 확인
  console.log('AttachmentList - 첨부파일 목록:', attachments);
  console.log('AttachmentList - 첨부파일 개수:', attachments?.length || 0);

  // 첨부파일이 없으면 렌더링하지 않음
  if (!attachments || attachments.length === 0) {
    return null;
  }

  // 삭제 권한 확인 (게시글 작성자 또는 첨부파일 업로더)
  const canDeleteAttachment = (attachment: BoardAttachment) => {
    return userId === boardCreatorId || userId === attachment.created_by;
  };

  // 파일 다운로드 처리
  const handleDownload = async (attachment: BoardAttachment) => {
    if (downloadingFiles.has(attachment.id)) return;

    setDownloadingFiles(prev => new Set(prev).add(attachment.id));
    
    try {
      await downloadAttachment(attachment.id, attachment.original_filename);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachment.id);
        return newSet;
      });
    }
  };

  // 파일 삭제 처리
  const handleDelete = async (attachment: BoardAttachment) => {
    if (!canDeleteAttachment(attachment) || deletingFiles.has(attachment.id)) return;

    if (!confirm('정말로 이 첨부파일을 삭제하시겠습니까?')) return;

    setDeletingFiles(prev => new Set(prev).add(attachment.id));
    
    try {
      await deleteAttachment(attachment.id);
      onAttachmentDeleted?.(attachment.id);
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('첨부파일 삭제에 실패했습니다.');
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachment.id);
        return newSet;
      });
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        📎 첨부파일 ({attachments.length})
      </h3>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <span className="text-xl">
                {getFileIcon(attachment.mime_type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.original_filename}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.file_size)} • {attachment.download_count || 0}회 다운로드
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleDownload(attachment)}
                disabled={downloadingFiles.has(attachment.id)}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {downloadingFiles.has(attachment.id) ? '다운로드 중...' : '다운로드'}
              </button>
              
              {canDeleteAttachment(attachment) && (
                <button
                  onClick={() => handleDelete(attachment)}
                  disabled={deletingFiles.has(attachment.id)}
                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deletingFiles.has(attachment.id) ? '삭제 중...' : '삭제'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentList; 