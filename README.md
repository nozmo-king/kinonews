# 🎬 kinonews

A HackerNews-style clone focused on cinema news and discussions.

## Features

- **Cinema-Focused**: Dedicated platform for movie news, reviews, discussions, and recommendations
- **Quick Account Creation**: Simple username-only registration for fast access
- **Voting System**: Upvote and downvote posts to surface the best content
- **Post Categories**: News, Reviews, Discussions, Recommendations, Festivals, Box Office
- **Modern Design**: Clean, responsive interface with a custom color scheme

## Color Scheme

- Primary: `#80A1BA` - Muted blue
- Secondary: `#91C4C3` - Soft teal
- Tertiary: `#B4DEBD` - Mint green
- Background: `#FFF7DD` - Cream

## Getting Started

Simply open `index.html` in your web browser to start using kinonews.

### Quick Start

1. Clone this repository
2. Open `index.html` in a web browser
3. Click "login" to create a quick account (just username, no password needed!)
4. Start browsing, voting, and submitting cinema news

## Usage

### Creating an Account

1. Click the "login" button in the header
2. Enter a username (3-20 characters)
3. Click "Create Account & Login"
4. You're ready to participate!

### Submitting Posts

1. Log in to your account
2. Click "submit" in the navigation
3. Fill in the post details:
   - **Title** (required): The headline of your post
   - **URL** (optional): Link to an article or resource
   - **Text** (optional): Additional context or discussion prompt
   - **Category**: Choose from News, Review, Discussion, Recommendation, Festival, or Box Office
4. Click "Submit Post"

### Voting

- Click the ▲ button to upvote a post
- Click the ▼ button to downvote a post
- Click again to remove your vote

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: LocalStorage for data persistence
- **Dependencies**: None - pure vanilla JavaScript

## Features Overview

### User Features
- Quick username-based authentication
- Vote on posts (upvote/downvote)
- Submit new posts with URLs or text
- Categorize posts for easy browsing
- View posts sorted by points

### Post Features
- Support for both link posts and text posts
- Category tagging (News, Review, Discussion, etc.)
- Point-based ranking system
- Timestamp and author attribution
- Clean, readable layout

### UI Features
- Responsive design for mobile and desktop
- Modal-based forms for clean UX
- Real-time updates without page refresh
- HackerNews-inspired layout
- Cinema-themed color palette

## Data Persistence

All data is stored in the browser's LocalStorage, including:
- User account information
- Posts and submissions
- User votes

To reset the application, clear your browser's LocalStorage for this domain.

## Browser Compatibility

Works in all modern browsers that support:
- ES6+ JavaScript
- LocalStorage API
- CSS Grid and Flexbox

## Contributing

This is a simple demonstration project. Feel free to fork and enhance it with additional features like:
- Comments on posts
- User profiles
- Search functionality
- Sorting options (new, top, best)
- More sophisticated authentication

## License

Open source - feel free to use and modify as needed.