-- Ruby Telegram Bot Database Schema
-- Cloudflare D1 Database

-- Users table for tracking user interactions
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    conversation_state TEXT DEFAULT 'initial',
    exchange_count INTEGER DEFAULT 0,
    last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
    joined_community BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversation history for logging and analysis
CREATE TABLE IF NOT EXISTS conversation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    message_type TEXT NOT NULL, -- 'user' or 'bot'
    content TEXT NOT NULL,
    ai_response BOOLEAN DEFAULT FALSE,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

-- Bot statistics and metrics
CREATE TABLE IF NOT EXISTS bot_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    metric_value TEXT NOT NULL,
    date_recorded DATE DEFAULT (DATE('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin actions log
CREATE TABLE IF NOT EXISTS admin_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_user_id INTEGER,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_conversation_telegram_id ON conversation_history(telegram_id);
CREATE INDEX IF NOT EXISTS idx_conversation_timestamp ON conversation_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_stats_date ON bot_stats(date_recorded);

-- Insert initial bot stats
INSERT OR IGNORE INTO bot_stats (metric_name, metric_value) VALUES
    ('total_users', '0'),
    ('conversations_started', '0'),
    ('community_conversions', '0'),
    ('bot_deployed_at', datetime('now'));
