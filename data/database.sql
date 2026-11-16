-- =====================================
-- iTEAM DATABASE
-- =====================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(30) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    github TEXT UNIQUE,
    phone VARCHAR(15) NOT NULL,
    profile_image TEXT DEFAULT '/images/profile-anonymous.svg',

    -- ทักษะและข้อความแนะนำตัว (แสดงในหน้าโปรไฟล์)
    skills TEXT[] NOT NULL DEFAULT '{}',
    bio TEXT,

    role TEXT CHECK (
        role IN ('member', 'admin')
    ) DEFAULT 'member',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);


-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_name TEXT UNIQUE NOT NULL
);


-- 3. TEAMS
CREATE TABLE IF NOT EXISTS teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,

    -- อนุญาตให้เป็น NULL เพื่อรองรับ ON DELETE SET NULL
    category_id INTEGER,

    -- จำนวนสมาชิกสูงสุด, สถานะรับสมัคร, ตำแหน่ง/ทักษะที่ทีมต้องการ
    max_members INTEGER NOT NULL DEFAULT 5
        CHECK (max_members BETWEEN 2 AND 50),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed')),
    roles TEXT[] NOT NULL DEFAULT '{}',

    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)
        REFERENCES categories (category_id)
        ON DELETE SET NULL,

    FOREIGN KEY (created_by)
        REFERENCES users (user_id)
        ON DELETE RESTRICT
);


-- 4. TEAM MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    team_role TEXT CHECK (
        team_role IN ('leader', 'member')
    ) DEFAULT 'member',

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (team_id, user_id),

    FOREIGN KEY (team_id)
        REFERENCES teams (team_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
);


-- 5. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    application_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    message TEXT,

    status TEXT CHECK (
        status IN ('pending', 'approved', 'rejected')
    ) DEFAULT 'pending',

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER NULL,
    reviewed_at TIMESTAMP NULL,

    FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (team_id)
        REFERENCES teams (team_id)
        ON DELETE CASCADE,

    FOREIGN KEY (reviewed_by)
        REFERENCES users (user_id)
        ON DELETE SET NULL
);

-- 6. FAVORITE TEAMS
CREATE TABLE IF NOT EXISTS favorite_teams (
    user_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams (team_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, team_id)
);

-- 7. USER NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================
-- INDEXES
-- =====================================

-- ป้องกันการส่งคำขอ pending เข้าทีมเดิมซ้ำ
CREATE UNIQUE INDEX IF NOT EXISTS
    unique_pending_application
ON applications (user_id, team_id)
WHERE status = 'pending';

-- ช่วยให้ค้นหาทีมตามหมวดหมู่ได้เร็วขึ้น
CREATE INDEX IF NOT EXISTS
    idx_teams_category
ON teams (category_id);

-- ช่วยให้ค้นหาสมาชิกของทีมได้เร็วขึ้น
CREATE INDEX IF NOT EXISTS
    idx_team_members_user
ON team_members (user_id);

-- ช่วยให้ค้นหาคำขอของทีมได้เร็วขึ้น
CREATE INDEX IF NOT EXISTS
    idx_applications_team
ON applications (team_id, status);

-- ช่วยให้ค้นหาคำขอของผู้ใช้ได้เร็วขึ้น
CREATE INDEX IF NOT EXISTS
    idx_applications_user
ON applications (user_id, applied_at DESC);

CREATE INDEX IF NOT EXISTS
    idx_favorite_teams_user
ON favorite_teams (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS
    idx_notifications_user
ON notifications (user_id, created_at DESC);
