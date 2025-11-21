# KinoNews 🎬

A HackerNews-style community for cinema enthusiasts. Share, discuss, and discover movies, film news, reviews, and cinematic discussions.

## Features

- **Quick Account Creation** - Minimal signup with just username and password
- **Submit Cinema Content** - Share links to reviews, articles, trailers, or create text discussions
- **Voting System** - Upvote great content and discussions
- **Nested Comments** - Threaded comment system for in-depth discussions
- **Karma System** - Build reputation through quality contributions
- **Ranking Algorithm** - HackerNews-style ranking to surface the best content

## Color Scheme

KinoNews uses a carefully selected palette:
- Primary: `#80A1BA` (Blue gray)
- Accent: `#91C4C3` (Teal)
- Highlight: `#B4DEBD` (Mint)
- Background: `#FFF7DD` (Cream)

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite3 (better-sqlite3)
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Authentication**: bcrypt + express-session
- **Styling**: Pure CSS with HackerNews-inspired design

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser to `http://localhost:3000`

## Usage

1. **Sign Up** - Click "login" and then "Create account" to make a new account
2. **Submit** - Click "submit" to share cinema-related content
3. **Vote** - Click the ▲ arrow to upvote posts you like
4. **Comment** - Click on a post to read and add comments
5. **Build Karma** - Earn karma points when others upvote your posts and comments

## Project Structure

```
kinonews/
├── server.js           # Express server and API routes
├── database.js         # SQLite database setup and queries
├── package.json        # Dependencies
├── public/
│   ├── index.html     # Main HTML template
│   ├── style.css      # Styling with custom color scheme
│   └── app.js         # Frontend JavaScript logic
└── kinonews.db        # SQLite database (created on first run)
```

## API Endpoints

- `POST /api/register` - Create new account
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user
- `GET /api/user/:username` - Get user profile
- `POST /api/posts` - Create new post
- `GET /api/posts` - Get all posts (ranked)
- `GET /api/posts/:id` - Get single post with comments
- `POST /api/comments` - Create comment
- `POST /api/vote` - Vote on post or comment

## License

MIT
