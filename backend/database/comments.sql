-- 댓글 테이블
CREATE TABLE IF NOT EXISTS board_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    parent_id INTEGER,  -- 대댓글인 경우 부모 댓글 ID, NULL이면 최상위 댓글
    content TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES board_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_board_comments_board_id ON board_comments(board_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_parent_id ON board_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_created_by ON board_comments(created_by); 