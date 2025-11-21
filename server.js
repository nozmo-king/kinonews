const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database('./kinonews.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connected');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT,
    text TEXT,
    user_id INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    text TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER,
    comment_id INTEGER,
    vote_type INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (comment_id) REFERENCES comments(id)
  )`);
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieSession({
  name: 'session',
  keys: ['kinonews-secret-key-change-in-production'],
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Middleware to add user to all requests
app.use((req, res, next) => {
  if (req.session.userId) {
    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
      if (user) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
});

// Routes
app.get('/', (req, res) => {
  db.all(`
    SELECT posts.*, users.username,
    (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comment_count
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.points DESC, posts.created_at DESC
    LIMIT 30
  `, (err, posts) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading posts');
    }
    res.render('index', { posts, user: req.user });
  });
});

app.get('/newest', (req, res) => {
  db.all(`
    SELECT posts.*, users.username,
    (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comment_count
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
    LIMIT 30
  `, (err, posts) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading posts');
    }
    res.render('index', { posts, user: req.user });
  });
});

app.get('/submit', (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  res.render('submit', { user: req.user });
});

app.post('/submit', (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }

  const { title, url, text } = req.body;

  if (!title) {
    return res.status(400).send('Title is required');
  }

  db.run(
    'INSERT INTO posts (title, url, text, user_id) VALUES (?, ?, ?, ?)',
    [title, url || null, text || null, req.user.id],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).send('Error creating post');
      }
      res.redirect('/item/' + this.lastID);
    }
  );
});

app.get('/item/:id', (req, res) => {
  const postId = req.params.id;

  db.get(`
    SELECT posts.*, users.username
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
  `, [postId], (err, post) => {
    if (err || !post) {
      return res.status(404).send('Post not found');
    }

    db.all(`
      SELECT comments.*, users.username
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at ASC
    `, [postId], (err, comments) => {
      if (err) {
        console.error(err);
        comments = [];
      }

      // Build comment tree
      const commentMap = {};
      const rootComments = [];

      comments.forEach(comment => {
        comment.replies = [];
        commentMap[comment.id] = comment;
      });

      comments.forEach(comment => {
        if (comment.parent_id) {
          if (commentMap[comment.parent_id]) {
            commentMap[comment.parent_id].replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      res.render('item', { post, comments: rootComments, user: req.user });
    });
  });
});

app.post('/comment', (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }

  const { post_id, parent_id, text } = req.body;

  if (!text) {
    return res.status(400).send('Comment text is required');
  }

  db.run(
    'INSERT INTO comments (post_id, user_id, parent_id, text) VALUES (?, ?, ?, ?)',
    [post_id, req.user.id, parent_id || null, text],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).send('Error creating comment');
      }
      res.redirect('/item/' + post_id);
    }
  );
});

app.post('/vote', (req, res) => {
  if (!req.user) {
    return res.json({ error: 'Not logged in' });
  }

  const { post_id, comment_id, vote_type } = req.body;

  if (post_id) {
    db.run(
      'INSERT OR REPLACE INTO votes (user_id, post_id, vote_type) VALUES (?, ?, ?)',
      [req.user.id, post_id, vote_type],
      (err) => {
        if (err) {
          return res.json({ error: 'Error voting' });
        }
        db.run('UPDATE posts SET points = points + ? WHERE id = ?', [vote_type, post_id]);
        res.json({ success: true });
      }
    );
  } else if (comment_id) {
    db.run(
      'INSERT OR REPLACE INTO votes (user_id, comment_id, vote_type) VALUES (?, ?, ?)',
      [req.user.id, comment_id, vote_type],
      (err) => {
        if (err) {
          return res.json({ error: 'Error voting' });
        }
        db.run('UPDATE comments SET points = points + ? WHERE id = ?', [vote_type, comment_id]);
        res.json({ success: true });
      }
    );
  }
});

app.get('/login', (req, res) => {
  res.render('login', { user: req.user });
});

app.post('/login', (req, res) => {
  const { username } = req.body;

  if (!username || username.length < 2) {
    return res.status(400).send('Username must be at least 2 characters');
  }

  // Quick account creation - if username doesn't exist, create it
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).send('Error logging in');
    }

    if (user) {
      req.session.userId = user.id;
      res.redirect('/');
    } else {
      // Create new user
      db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
        if (err) {
          return res.status(500).send('Error creating account');
        }
        req.session.userId = this.lastID;
        res.redirect('/');
      });
    }
  });
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get('/user/:username', (req, res) => {
  const username = req.params.username;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, profileUser) => {
    if (err || !profileUser) {
      return res.status(404).send('User not found');
    }

    db.all(`
      SELECT posts.*, users.username,
      (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comment_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE users.username = ?
      ORDER BY posts.created_at DESC
      LIMIT 30
    `, [username], (err, posts) => {
      if (err) {
        posts = [];
      }

      db.all(`
        SELECT comments.*, posts.title as post_title, posts.id as post_id
        FROM comments
        JOIN users ON comments.user_id = users.id
        JOIN posts ON comments.post_id = posts.id
        WHERE users.username = ?
        ORDER BY comments.created_at DESC
        LIMIT 30
      `, [username], (err, comments) => {
        if (err) {
          comments = [];
        }

        res.render('user', { profileUser, posts, comments, user: req.user });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`KinoNews server running on http://localhost:${PORT}`);
});
