-- Teams created by a banned member are hidden and restored with that member.
ALTER TABLE teams
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
