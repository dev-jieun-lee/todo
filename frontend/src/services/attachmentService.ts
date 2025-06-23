/**
 * 첨부파일 서비스
 * 게시글 첨부파일의 업로드, 다운로드, 삭제 API 호출을 담당
 * 
 * 설계 의사결정:
 * - axios 인스턴스를 사용하여 일관된 API 호출
 * - FormData를 사용한 파일 업로드 처리
 * - 에러 처리를 통한 사용자 경험 개선
 * - 타입 안전성을 위한 TypeScript 인터페이스 활용
 */
import api from "../utils/axiosInstance";
import type { 
  BoardAttachment, 
  AttachmentUploadResponse 
} from "../types/board";

/**
 * 첨부파일 업로드
 * @param boardId - 게시글 ID
 * @param file - 업로드할 파일
 * @returns 업로드된 첨부파일 정보
 */
export const uploadAttachment = async (
  boardId: number, 
  file: File
): Promise<AttachmentUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('boardId', boardId.toString());

    const response = await api.post('/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error("첨부파일 업로드 실패:", error);
    throw new Error("첨부파일 업로드에 실패했습니다.");
  }
};

/**
 * 첨부파일 목록 조회
 * @param boardId - 게시글 ID
 * @returns 첨부파일 목록
 */
export const getAttachments = async (boardId: number): Promise<BoardAttachment[]> => {
  try {
    const response = await api.get(`/attachments/${boardId}`);
    return response.data;
  } catch (error) {
    console.error("첨부파일 목록 조회 실패:", error);
    throw new Error("첨부파일 목록을 불러오는데 실패했습니다.");
  }
};

/**
 * 첨부파일 다운로드
 * @param attachmentId - 첨부파일 ID
 * @param filename - 다운로드할 파일명
 */
export const downloadAttachment = async (attachmentId: number, filename: string): Promise<void> => {
  try {
    const response = await api.get(`/attachments/download/${attachmentId}`, {
      responseType: 'blob',
    });

    // 파일 다운로드 처리
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("첨부파일 다운로드 실패:", error);
    throw new Error("첨부파일 다운로드에 실패했습니다.");
  }
};

/**
 * 첨부파일 삭제
 * @param attachmentId - 첨부파일 ID
 * @returns 삭제 완료 메시지
 */
export const deleteAttachment = async (attachmentId: number): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/attachments/${attachmentId}`);
    return response.data;
  } catch (error) {
    console.error("첨부파일 삭제 실패:", error);
    throw new Error("첨부파일 삭제에 실패했습니다.");
  }
};

/**
 * 파일 크기 포맷팅
 * @param bytes - 바이트 단위 크기
 * @returns 포맷된 파일 크기 문자열
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 파일 타입에 따른 아이콘 반환
 * @param mimeType - MIME 타입
 * @returns 파일 타입 아이콘
 */
export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType === 'text/plain') return '📄';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  return '📎';
}; 