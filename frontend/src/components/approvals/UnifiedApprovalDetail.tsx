import UnifiedApprovalDetailInlineView from "./UnifiedApprovalDetailInlineView";

interface Props {
  targetType: string;
  targetId: number;
  commonCodeMap: Record<string, { code: string; label: string }[]>;
}

// 페이지 레벨에서 InlineView만 리턴!
export default function UnifiedApprovalDetail({
  targetType,
  targetId,
  commonCodeMap,
}: Props) {
  return (
    <UnifiedApprovalDetailInlineView
      targetType={targetType}
      targetId={targetId}
      commonCodeMap={commonCodeMap}
    />
  );
}
