-- 掲示板
CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  ip_hash    TEXT,                        -- 連投防止用（IPそのものは保存しない）
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_ip ON comments(ip_hash, created_at);

-- MVP投票（1端末1票。締め切りまでは選び直し可）
CREATE TABLE IF NOT EXISTS votes (
  voter_id     TEXT    PRIMARY KEY,       -- 端末ごとのランダムなID（Cookie）
  candidate_id INTEGER NOT NULL,
  ip_hash      TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 設定（投票の受付中/停止など）
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
