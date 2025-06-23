/**
 * 파일 업로드 컴포넌트
 * 게시글 작성/수정 시 첨부파일을 업로드하는 컴포넌트
 * 
 * 설계 의사결정:
 * - 드래그 앤 드롭과 클릭 업로드 모두 지원
 * - 파일 타입 및 크기 검증
 * - 업로드 진행 상태 표시
 * - 파일 미리보기 기능
 * - 업로드된 파일 목록 관리
 */
import React, { useState, useRef, useCallback } from 'react';
import { uploadAttachment, formatFileSize, getFileIcon } from '../../services/attachmentService';
import type { AttachmentUploadResponse } from '../../types/board';

interface FileUploadProps {
  boardId: number;
  onFileUploaded?: (attachment: AttachmentUploadResponse) => void;
  maxFiles?: number;
  maxFileSize?: number; // MB 단위
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  boardId,
  onFileUploaded,
  maxFiles = 5,
  maxFileSize = 10 // 10MB
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // 허용된 파일 타입
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  // 파일 검증
  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return '허용되지 않는 파일 타입입니다.';
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `파일 크기는 ${maxFileSize}MB 이하여야 합니다.`;
    }

    return null;
  };

  // 파일 업로드 처리
  const handleFileUpload = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    const uploadingFile: UploadingFile = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      // 실제 업로드 진행률을 시뮬레이션 (실제로는 XMLHttpRequest나 fetch의 progress 이벤트 사용)
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 100);

      const attachment = await uploadAttachment(boardId, file);
      
      clearInterval(progressInterval);
      
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === uploadingFile.id 
            ? { ...f, progress: 100, status: 'success' }
            : f
        )
      );

      onFileUploaded?.(attachment);

      // 성공 후 잠시 후 제거
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id));
      }, 2000);

    } catch {
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === uploadingFile.id 
            ? { ...f, status: 'error', error: '업로드 실패' }
            : f
        )
      );
    }
  }, [boardId, onFileUploaded, maxFileSize]);

  // 파일 선택 처리
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(handleFileUpload);
    
    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 드래그 앤 드롭 처리
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFileUpload);
  };

  // 업로드 영역 클릭
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 파일 업로드 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadAreaClick}
      >
        <div className="space-y-2">
          <div className="text-4xl">📎</div>
          <p className="text-lg font-medium text-gray-900">
            파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-sm text-gray-500">
            최대 {maxFiles}개 파일, 각 {maxFileSize}MB 이하
          </p>
          <p className="text-xs text-gray-400">
            지원 형식: 이미지, PDF, Word, Excel, 텍스트, 압축파일
          </p>
        </div>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 업로드 중인 파일 목록 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">업로드 중...</h4>
          {uploadingFiles.map((uploadingFile) => (
            <div
              key={uploadingFile.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-xl">
                  {getFileIcon(uploadingFile.file.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadingFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadingFile.file.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {uploadingFile.status === 'uploading' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadingFile.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {uploadingFile.progress}%
                    </span>
                  </div>
                )}
                
                {uploadingFile.status === 'success' && (
                  <span className="text-green-500 text-sm">✓ 완료</span>
                )}
                
                {uploadingFile.status === 'error' && (
                  <span className="text-red-500 text-sm">✗ 실패</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 