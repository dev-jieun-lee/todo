/**
 * 게시글 작성/수정 폼 컴포넌트
 * 자유게시판의 게시글을 작성하거나 수정하는 폼을 제공
 * 
 * 설계 의사결정:
 * - 재사용 가능한 컴포넌트로 작성과 수정 모두 지원
 * - 실시간 유효성 검사로 사용자 경험 개선
 * - 제출 중 상태 표시로 중복 제출 방지
 * - 반응형 디자인으로 모바일 환경 지원
 * - 팀장 이상 권한 사용자에게 공지사항 등록 옵션 제공
 * - 첨부파일 업로드 기능 추가
 */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import type { BoardPost, BoardPostFormState, AttachmentUploadResponse } from "../../types/board";
import FileUpload from "./FileUpload";

interface PostFormProps {
  mode: "create" | "edit";
  initialData?: BoardPost;
  onSubmit: (data: { title: string; content: string; isNotice?: boolean }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  canWriteNotice?: boolean;
}

const PostForm: React.FC<PostFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  canWriteNotice = false,
}) => {
  // 폼 상태 관리
  const [formState, setFormState] = useState<BoardPostFormState>({
    title: "",
    content: "",
    isSubmitting: false,
  });

  // 공지사항 등록 여부 (팀장 이상 권한 사용자만 사용 가능)
  const [isNotice, setIsNotice] = useState(false);

  // 첨부파일 관리
  const [boardId, setBoardId] = useState<number | null>(null);

  // 에러 상태 관리
  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
  }>({});

  // 수정 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormState({
        title: initialData.title,
        content: initialData.content,
        isSubmitting: false,
      });
      setIsNotice(initialData.type === "NOTICE");
      setBoardId(initialData.id);
    }
  }, [mode, initialData]);

  // 첨부파일 업로드 완료 처리
  const handleFileUploaded = (attachment: AttachmentUploadResponse) => {
    // 첨부파일 업로드 완료 시 처리 (필요시 추가 로직 구현)
    console.log('첨부파일 업로드 완료:', attachment);
  };

  // 임시 게시글 ID 생성 (작성 모드에서 첨부파일 업로드를 위해)
  const getTempBoardId = (): number => {
    if (boardId) return boardId;
    // 임시 ID 생성 (음수로 구분)
    return -Date.now();
  };

  /**
   * 입력값 변경 핸들러
   * @param field - 변경된 필드명
   * @param value - 새로운 값
   */
  const handleInputChange = (field: "title" | "content", value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    
    // 실시간 유효성 검사
    validateField(field, value);
  };

  /**
   * 필드별 유효성 검사
   * @param field - 검사할 필드명
   * @param value - 검사할 값
   */
  const validateField = (field: "title" | "content", value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case "title":
        if (!value.trim()) {
          newErrors.title = "제목을 입력해주세요.";
        } else if (value.trim().length < 2) {
          newErrors.title = "제목은 2자 이상 입력해주세요.";
        } else if (value.trim().length > 100) {
          newErrors.title = "제목은 100자 이하로 입력해주세요.";
        } else {
          delete newErrors.title;
        }
        break;
        
      case "content":
        if (!value.trim()) {
          newErrors.content = "내용을 입력해주세요.";
        } else if (value.trim().length < 10) {
          newErrors.content = "내용은 10자 이상 입력해주세요.";
        } else if (value.trim().length > 5000) {
          newErrors.content = "내용은 5000자 이하로 입력해주세요.";
        } else {
          delete newErrors.content;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  /**
   * 전체 폼 유효성 검사
   * @returns 유효성 검사 통과 여부
   */
  const validateForm = (): boolean => {
    validateField("title", formState.title);
    validateField("content", formState.content);
    
    return !errors.title && !errors.content && 
           Boolean(formState.title.trim()) && 
           Boolean(formState.content.trim());
  };

  /**
   * 폼 제출 핸들러
   * @param e - 폼 이벤트
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      await onSubmit({
        title: formState.title.trim(),
        content: formState.content.trim(),
        isNotice: canWriteNotice ? isNotice : false,
      });
    } catch (error) {
      console.error("폼 제출 실패:", error);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <h2 className="text-xl font-bold">
          {mode === "create" ? "새 게시글 작성" : "게시글 수정"}
        </h2>
        <p className="text-sm text-gray-600">
          {mode === "create" 
            ? "자유롭게 의견을 나누어보세요." 
            : "게시글을 수정합니다."}
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 공지사항 등록 옵션 (팀장 이상 권한 사용자만, 작성 모드에서만) */}
          {mode === "create" && canWriteNotice && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <input
                  id="isNotice"
                  type="checkbox"
                  checked={isNotice}
                  onChange={(e) => setIsNotice(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isNotice" className="text-sm font-medium text-blue-800">
                  📢 공지사항으로 등록
                </label>
              </div>
              <p className="text-xs text-blue-600 mt-1 ml-7">
                공지사항으로 등록하면 모든 사용자에게 중요하게 표시됩니다.
              </p>
            </div>
          )}

          {/* 제목 입력 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목 *
            </label>
            <input
              id="title"
              type="text"
              value={formState.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="제목을 입력하세요"
              maxLength={100}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formState.title.length}/100자
            </p>
          </div>

          {/* 내용 입력 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              내용 *
            </label>
            <textarea
              id="content"
              value={formState.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              rows={10}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="내용을 입력하세요"
              maxLength={5000}
              disabled={isSubmitting}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formState.content.length}/5000자
            </p>
          </div>

          {/* 첨부파일 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              첨부파일
            </label>
            <FileUpload
              boardId={getTempBoardId()}
              onFileUploaded={handleFileUploaded}
              maxFiles={5}
              maxFileSize={10}
            />
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formState.title.trim() || !formState.content.trim()}
              className="px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {mode === "create" ? "작성 중..." : "수정 중..."}
                </span>
              ) : (
                mode === "create" ? "작성하기" : "수정하기"
              )}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PostForm; 