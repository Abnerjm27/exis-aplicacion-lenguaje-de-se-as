-- Esquema PostgreSQL para Manitas (Proyecto EXIS · Tutor LSC)
-- Idempotente: seguro para ejecutar al arrancar o via docker-entrypoint-initdb.d

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    password_hash TEXT,
    level VARCHAR(50) NOT NULL DEFAULT 'Principiante',
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    streak INTEGER NOT NULL DEFAULT 1 CHECK (streak >= 0),
    mastered_signs JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sign_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sign_id VARCHAR(32) NOT NULL,
    box SMALLINT NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    successes INTEGER NOT NULL DEFAULT 0 CHECK (successes >= 0),
    mastered BOOLEAN NOT NULL DEFAULT FALSE,
    last_practiced_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    UNIQUE(user_id, sign_id)
);

CREATE TABLE IF NOT EXISTS exam_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_title VARCHAR(100) NOT NULL,
    score_pct SMALLINT NOT NULL CHECK (score_pct BETWEEN 0 AND 100),
    correct_cnt INTEGER NOT NULL CHECK (correct_cnt >= 0),
    total_cnt INTEGER NOT NULL CHECK (total_cnt >= 0),
    date_iso VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_uid VARCHAR(64) NOT NULL,
    title VARCHAR(100) NOT NULL,
    rationale VARCHAR(300) NOT NULL DEFAULT '',
    signs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sign_progress_due
    ON user_sign_progress (user_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_date
    ON exam_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_plans_user
    ON custom_plans (user_id);
