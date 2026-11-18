CREATE TABLE IF NOT EXISTS reports (
    report_id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'team')),
    reported_user_id INTEGER REFERENCES users (user_id) ON DELETE RESTRICT,
    team_id INTEGER REFERENCES teams (team_id) ON DELETE RESTRICT,
    reason TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 1000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'handled')),
    reviewed_by INTEGER REFERENCES users (user_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    CHECK (
        (target_type = 'user' AND reported_user_id IS NOT NULL AND team_id IS NULL)
        OR (target_type = 'team' AND reported_user_id IS NULL AND team_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_reports_status_created
    ON reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_reporter
    ON reports (reporter_id, created_at DESC);
