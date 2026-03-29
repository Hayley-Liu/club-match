const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || './db/club_match.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ========== 建表 ==========
db.exec(`
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','leader','admin')),
  name        TEXT,
  student_id  TEXT,
  phone       TEXT,
  avatar_url  TEXT DEFAULT '',
  major       TEXT,
  created_at  TEXT DEFAULT (datetime('now','localtime')),
  updated_at  TEXT DEFAULT (datetime('now','localtime'))
);

-- 测评记录表
CREATE TABLE IF NOT EXISTS assessments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  answers      TEXT NOT NULL DEFAULT '{}',
  tags         TEXT DEFAULT '[]',
  status       TEXT DEFAULT 'draft' CHECK(status IN ('draft','completed')),
  draft_step   INTEGER DEFAULT 0,
  completed_at TEXT,
  expires_at   TEXT,
  created_at   TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 社团表
CREATE TABLE IF NOT EXISTS clubs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT UNIQUE NOT NULL,
  category       TEXT NOT NULL CHECK(category IN ('art','sport','academic','public','comprehensive')),
  description    TEXT DEFAULT '',
  cover_image    TEXT DEFAULT '',
  photos         TEXT DEFAULT '[]',
  tags           TEXT DEFAULT '[]',
  leader_id      INTEGER NOT NULL,
  max_members    INTEGER DEFAULT 30,
  current_count  INTEGER DEFAULT 0,
  contact_info   TEXT DEFAULT '{}',
  status         TEXT DEFAULT 'pending' CHECK(status IN ('pending','active','suspended','rejected','offline')),
  reject_reason  TEXT DEFAULT '',
  recruit_end_at TEXT,
  is_recruiting  INTEGER DEFAULT 0,
  view_count     INTEGER DEFAULT 0,
  created_at     TEXT DEFAULT (datetime('now','localtime')),
  updated_at     TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (leader_id) REFERENCES users(id)
);

-- 报名申请表
CREATE TABLE IF NOT EXISTS applications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  club_id       INTEGER NOT NULL,
  name          TEXT,
  student_id    TEXT,
  phone         TEXT,
  major         TEXT,
  introduction  TEXT DEFAULT '',
  skill_tags    TEXT DEFAULT '[]',
  match_score   REAL DEFAULT 0,
  match_reasons TEXT DEFAULT '[]',
  status        TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
  reject_reason TEXT DEFAULT '',
  created_at    TEXT DEFAULT (datetime('now','localtime')),
  updated_at    TEXT DEFAULT (datetime('now','localtime')),
  UNIQUE(user_id, club_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL CHECK(type IN ('system','club_review','apply_review')),
  title       TEXT NOT NULL,
  content     TEXT DEFAULT '',
  sender_id   INTEGER,
  target_type TEXT DEFAULT 'all' CHECK(target_type IN ('all','students','leaders','user')),
  target_id   INTEGER,
  is_top      INTEGER DEFAULT 0,
  is_urgent   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now','localtime'))
);

-- 通知已读表
CREATE TABLE IF NOT EXISTS notification_reads (
  user_id         INTEGER NOT NULL,
  notification_id INTEGER NOT NULL,
  read_at         TEXT,
  is_deleted      INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, notification_id)
);

-- 社团收藏表
CREATE TABLE IF NOT EXISTS club_favorites (
  user_id    INTEGER NOT NULL,
  club_id    INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, club_id)
);
`);

module.exports = db;
