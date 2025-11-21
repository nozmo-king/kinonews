const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const db = new Database(path.join(__dirname, 'kinonews.db'));

// Initialize database schema
function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      karma INTEGER DEFAULT 0
    )
  `);

  // Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT,
      text TEXT,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      points INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      parent_id INTEGER,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      points INTEGER DEFAULT 0,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (parent_id) REFERENCES comments(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Votes table (to track who voted on what)
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER,
      comment_id INTEGER,
      vote_type INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (comment_id) REFERENCES comments(id),
      UNIQUE(user_id, post_id),
      UNIQUE(user_id, comment_id)
    )
  `);

  console.log('Database initialized successfully');
}

// Initialize on require
initDatabase();

// User functions
const createUser = db.prepare(`
  INSERT INTO users (username, email, password_hash)
  VALUES (?, ?, ?)
`);

const getUserByUsername = db.prepare(`
  SELECT * FROM users WHERE username = ?
`);

const getUserById = db.prepare(`
  SELECT id, username, email, created_at, karma FROM users WHERE id = ?
`);

// Post functions
const createPost = db.prepare(`
  INSERT INTO posts (title, url, text, user_id)
  VALUES (?, ?, ?, ?)
`);

const getPostById = db.prepare(`
  SELECT p.*, u.username
  FROM posts p
  JOIN users u ON p.user_id = u.id
  WHERE p.id = ?
`);

const getPosts = db.prepare(`
  SELECT p.*, u.username,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
  FROM posts p
  JOIN users u ON p.user_id = u.id
  ORDER BY (p.points / POWER((julianday('now') - julianday(p.created_at)) * 24 + 2, 1.8)) DESC
  LIMIT ? OFFSET ?
`);

// Comment functions
const createComment = db.prepare(`
  INSERT INTO comments (post_id, parent_id, user_id, text)
  VALUES (?, ?, ?, ?)
`);

const getCommentsByPostId = db.prepare(`
  SELECT c.*, u.username
  FROM comments c
  JOIN users u ON c.user_id = u.id
  WHERE c.post_id = ?
  ORDER BY c.created_at ASC
`);

// Vote functions
const createVote = db.prepare(`
  INSERT OR REPLACE INTO votes (user_id, post_id, comment_id, vote_type)
  VALUES (?, ?, ?, ?)
`);

const getVote = db.prepare(`
  SELECT * FROM votes
  WHERE user_id = ? AND (post_id = ? OR comment_id = ?)
`);

const updatePostPoints = db.prepare(`
  UPDATE posts SET points = (
    SELECT COALESCE(SUM(vote_type), 0) FROM votes WHERE post_id = ?
  ) WHERE id = ?
`);

const updateCommentPoints = db.prepare(`
  UPDATE comments SET points = (
    SELECT COALESCE(SUM(vote_type), 0) FROM votes WHERE comment_id = ?
  ) WHERE id = ?
`);

const updateUserKarma = db.prepare(`
  UPDATE users SET karma = (
    SELECT COALESCE(SUM(points), 0) FROM (
      SELECT points FROM posts WHERE user_id = ?
      UNION ALL
      SELECT points FROM comments WHERE user_id = ?
    )
  ) WHERE id = ?
`);

module.exports = {
  db,
  initDatabase,
  createUser,
  getUserByUsername,
  getUserById,
  createPost,
  getPostById,
  getPosts,
  createComment,
  getCommentsByPostId,
  createVote,
  getVote,
  updatePostPoints,
  updateCommentPoints,
  updateUserKarma
};
