ALTER TABLE todos ADD COLUMN user_id INTEGER;
ALTER TABLE todos ADD COLUMN status TEXT DEFAULT '예정';
ALTER TABLE todos ADD COLUMN due_date TEXT; 