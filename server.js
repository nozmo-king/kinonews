const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'kinonews-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// API Routes

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if user exists
    const existingUser = db.getUserByUsername.get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = db.createUser.run(username, email || null, passwordHash);

    // Log user in
    req.session.userId = result.lastInsertRowid;
    req.session.username = username;

    res.json({
      success: true,
      user: { id: result.lastInsertRowid, username }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = db.getUserByUsername.get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      success: true,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
app.get('/api/user', (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }

  const user = db.getUserById.get(req.session.userId);
  res.json({ user });
});

// Get user profile
app.get('/api/user/:username', (req, res) => {
  try {
    const user = db.getUserByUsername.get(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      created_at: user.created_at,
      karma: user.karma
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create post
app.post('/api/posts', requireAuth, (req, res) => {
  try {
    const { title, url, text } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const result = db.createPost.run(
      title,
      url || null,
      text || null,
      req.session.userId
    );

    res.json({
      success: true,
      postId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get posts (front page)
app.get('/api/posts', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = 30;
    const offset = page * limit;

    const posts = db.getPosts.all(limit, offset);
    res.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post with comments
app.get('/api/posts/:id', (req, res) => {
  try {
    const post = db.getPostById.get(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comments = db.getCommentsByPostId.all(req.params.id);

    res.json({ post, comments });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create comment
app.post('/api/comments', requireAuth, (req, res) => {
  try {
    const { postId, parentId, text } = req.body;

    if (!postId || !text) {
      return res.status(400).json({ error: 'Post ID and text required' });
    }

    const result = db.createComment.run(
      postId,
      parentId || null,
      req.session.userId,
      text
    );

    res.json({
      success: true,
      commentId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Vote on post or comment
app.post('/api/vote', requireAuth, (req, res) => {
  try {
    const { postId, commentId, voteType } = req.body;

    if ((!postId && !commentId) || (voteType !== 1 && voteType !== -1)) {
      return res.status(400).json({ error: 'Invalid vote parameters' });
    }

    // Create or update vote
    db.createVote.run(
      req.session.userId,
      postId || null,
      commentId || null,
      voteType
    );

    // Update points
    if (postId) {
      db.updatePostPoints.run(postId, postId);
      const post = db.getPostById.get(postId);
      if (post) {
        db.updateUserKarma.run(post.user_id, post.user_id, post.user_id);
      }
    } else if (commentId) {
      db.updateCommentPoints.run(commentId, commentId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`KinoNews running on http://localhost:${PORT}`);
});
