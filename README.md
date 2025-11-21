# 🎬 KinoNews

A HackerNews-style discussion platform focused on cinema, film, and everything related to movies.

## Features

- **Quick Account Creation**: Just enter a username - no email or password required!
- **Submit Posts**: Share film reviews, articles, or start text discussions about cinema
- **Voting System**: Upvote posts and comments you like
- **Threaded Comments**: Engage in nested discussions about films
- **User Profiles**: View user submissions and comment history

## Color Scheme

KinoNews uses a carefully selected color palette:
- `#80A1BA` - Primary blue (header, links)
- `#91C4C3` - Hover blue (interactive elements)
- `#B4DEBD` - Accent mint (borders, highlights)
- `#FFF7DD` - Cream background (main background)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nozmo-king/kinonews.git
   cd kinonews
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

## Usage

### Creating an Account

1. Click "login" in the header
2. Enter a username (at least 2 characters)
3. Click "Login / Create Account"
4. If the username doesn't exist, a new account is automatically created!

### Submitting a Post

1. Make sure you're logged in
2. Click "submit" in the header
3. Enter a title (required)
4. Add either a URL or text content (optional)
5. Click "Submit"

### Commenting

1. Navigate to any post by clicking on it
2. Type your comment in the text area
3. Click "Add Comment"
4. Reply to existing comments by clicking "reply"

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: SQLite3
- **Template Engine**: EJS
- **Session Management**: cookie-session
- **Frontend**: Vanilla JavaScript with inline CSS

## Project Structure

```
kinonews/
├── server.js          # Main application server
├── package.json       # Project dependencies
├── views/            # EJS templates
│   ├── index.ejs     # Home page
│   ├── login.ejs     # Login/signup page
│   ├── submit.ejs    # Submit post page
│   ├── item.ejs      # Post detail page
│   └── user.ejs      # User profile page
└── README.md         # This file
```

## License

ISC