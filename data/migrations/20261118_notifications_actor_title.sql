BEGIN;

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS actor_id INTEGER REFERENCES users (user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS title VARCHAR(255);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'notifications'
          AND column_name = 'link_url'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'notifications'
          AND column_name = 'link'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN link_url TO link;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'notifications'
          AND column_name = 'link_url'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'notifications'
          AND column_name = 'link'
    ) THEN
        UPDATE notifications SET link = COALESCE(link, link_url);
        ALTER TABLE notifications DROP COLUMN link_url;
    END IF;
END $$;

UPDATE notifications
SET title = CASE type
    WHEN 'application_received' THEN 'มีคำขอเข้าร่วมทีมใหม่'
    WHEN 'application_approved' THEN 'คำขอได้รับการอนุมัติ'
    WHEN 'application_rejected' THEN 'คำขอถูกปฏิเสธ'
    ELSE 'การแจ้งเตือน'
END
WHERE title IS NULL;

UPDATE notifications SET is_read = FALSE WHERE is_read IS NULL;
UPDATE notifications SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

ALTER TABLE notifications
    ALTER COLUMN type TYPE VARCHAR(50) USING type::VARCHAR(50),
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN message DROP NOT NULL,
    ALTER COLUMN is_read SET DEFAULT FALSE,
    ALTER COLUMN is_read SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, created_at DESC)
    WHERE is_read = FALSE;

COMMIT;
