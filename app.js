// Kinonews - Cinema News Application

// Sample initial posts for demonstration
const samplePosts = [
    {
        id: 1,
        title: "Dune: Part Two breaks box office records worldwide",
        url: "https://example.com/dune-part-two",
        category: "box-office",
        author: "cinema_fan",
        points: 142,
        comments: 87,
        timestamp: Date.now() - 3600000 * 2
    },
    {
        id: 2,
        title: "Cannes Film Festival 2024 announces official selection",
        url: "https://example.com/cannes-2024",
        category: "festival",
        author: "film_critic",
        points: 98,
        comments: 45,
        timestamp: Date.now() - 3600000 * 5
    },
    {
        id: 3,
        title: "What are your thoughts on slow cinema?",
        text: "I've been watching more slow cinema lately and I'm fascinated by the patience and attention to detail. Films like those by Bela Tarr, Tsai Ming-liang, and Apichatpong Weerasethakul...",
        category: "discussion",
        author: "arthouse_lover",
        points: 67,
        comments: 123,
        timestamp: Date.now() - 3600000 * 8
    },
    {
        id: 4,
        title: "Christopher Nolan's Oppenheimer wins Best Picture at Oscars",
        url: "https://example.com/oscars-oppenheimer",
        category: "news",
        author: "awards_watcher",
        points: 234,
        comments: 156,
        timestamp: Date.now() - 3600000 * 12
    },
    {
        id: 5,
        title: "Hidden gem: The Man from Earth (2007) - A brilliant low-budget sci-fi",
        text: "Just watched this and was blown away. The entire film takes place in one room with minimal special effects, but the philosophical conversations are riveting.",
        category: "recommendation",
        author: "movie_discoverer",
        points: 189,
        comments: 92,
        timestamp: Date.now() - 3600000 * 15
    },
    {
        id: 6,
        title: "Poor Things review: Emma Stone shines in Yorgos Lanthimos's latest",
        url: "https://example.com/poor-things-review",
        category: "review",
        author: "certified_critic",
        points: 76,
        comments: 34,
        timestamp: Date.now() - 3600000 * 18
    }
];

class KinonewsApp {
    constructor() {
        this.posts = [];
        this.currentUser = null;
        this.userVotes = {};
        this.init();
    }

    init() {
        // Load data from localStorage
        this.loadFromStorage();
        
        // If no posts exist, load sample posts
        if (this.posts.length === 0) {
            this.posts = [...samplePosts];
            this.saveToStorage();
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Render initial state
        this.renderPosts();
        this.updateUserDisplay();
    }

    loadFromStorage() {
        try {
            const postsData = localStorage.getItem('kinonews_posts');
            const userData = localStorage.getItem('kinonews_user');
            const votesData = localStorage.getItem('kinonews_votes');

            if (postsData) {
                this.posts = JSON.parse(postsData);
            }
            if (userData) {
                this.currentUser = JSON.parse(userData);
            }
            if (votesData) {
                this.userVotes = JSON.parse(votesData);
            }
        } catch (e) {
            console.error('Error loading from storage:', e);
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('kinonews_posts', JSON.stringify(this.posts));
            localStorage.setItem('kinonews_user', JSON.stringify(this.currentUser));
            localStorage.setItem('kinonews_votes', JSON.stringify(this.userVotes));
        } catch (e) {
            console.error('Error saving to storage:', e);
        }
    }

    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const authModal = document.getElementById('auth-modal');
        const authForm = document.getElementById('auth-form');

        loginBtn.addEventListener('click', () => {
            authModal.style.display = 'block';
        });

        logoutBtn.addEventListener('click', () => {
            this.logout();
        });

        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            if (username) {
                this.login(username);
                authModal.style.display = 'none';
                authForm.reset();
            }
        });

        // Submit button
        const submitLinks = document.querySelectorAll('.nav-link');
        submitLinks.forEach(link => {
            if (link.textContent === 'submit') {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.currentUser) {
                        document.getElementById('submit-modal').style.display = 'block';
                    } else {
                        alert('Please login to submit posts');
                        document.getElementById('auth-modal').style.display = 'block';
                    }
                });
            }
        });

        // Submit form
        const submitForm = document.getElementById('submit-form');
        submitForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitPost();
        });

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').style.display = 'none';
            });
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    login(username) {
        this.currentUser = {
            username: username,
            joinedAt: Date.now()
        };
        this.saveToStorage();
        this.updateUserDisplay();
    }

    logout() {
        this.currentUser = null;
        this.saveToStorage();
        this.updateUserDisplay();
    }

    updateUserDisplay() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const usernameDisplay = document.getElementById('username-display');

        if (this.currentUser) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            usernameDisplay.style.display = 'block';
            usernameDisplay.textContent = this.currentUser.username;
        } else {
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            usernameDisplay.style.display = 'none';
        }
    }

    submitPost() {
        const title = document.getElementById('post-title').value.trim();
        const url = document.getElementById('post-url').value.trim();
        const text = document.getElementById('post-text').value.trim();
        const category = document.getElementById('post-category').value;

        if (!title) {
            alert('Title is required');
            return;
        }

        const timestamp = Date.now();
        const newPost = {
            id: timestamp + Math.floor(Math.random() * 1000),
            title: title,
            url: url || null,
            text: text || null,
            category: category,
            author: this.currentUser.username,
            points: 1,
            comments: 0,
            timestamp: timestamp
        };

        // Auto-upvote own post
        this.userVotes[newPost.id] = 1;

        this.posts.unshift(newPost);
        this.saveToStorage();
        this.renderPosts();

        // Close modal and reset form
        document.getElementById('submit-modal').style.display = 'none';
        document.getElementById('submit-form').reset();
    }

    vote(postId, direction) {
        if (!this.currentUser) {
            alert('Please login to vote');
            document.getElementById('auth-modal').style.display = 'block';
            return;
        }

        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const currentVote = this.userVotes[postId] || 0;
        let newVote = 0;

        if (direction === 'up') {
            newVote = currentVote === 1 ? 0 : 1;
        } else if (direction === 'down') {
            newVote = currentVote === -1 ? 0 : -1;
        }

        // Update points
        post.points += (newVote - currentVote);
        this.userVotes[postId] = newVote;

        this.saveToStorage();
        this.renderPosts();
    }

    renderPosts() {
        const container = document.getElementById('posts-container');
        
        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>🎬 No posts yet</h3>
                    <p>Be the first to share cinema news!</p>
                </div>
            `;
            return;
        }

        // Sort posts by points (top sorting)
        const sortedPosts = [...this.posts].sort((a, b) => b.points - a.points);

        container.innerHTML = sortedPosts.map((post, index) => {
            const userVote = this.userVotes[post.id] || 0;
            const timeAgo = this.getTimeAgo(post.timestamp);
            const domain = post.url ? this.getDomain(post.url) : '';

            return `
                <div class="post-item">
                    <div class="vote-section">
                        <button class="vote-btn ${userVote === 1 ? 'voted' : ''}" 
                                onclick="app.vote(${post.id}, 'up')" 
                                title="Upvote">▲</button>
                        <div class="vote-count">${post.points}</div>
                        <button class="vote-btn ${userVote === -1 ? 'voted' : ''}" 
                                onclick="app.vote(${post.id}, 'down')" 
                                title="Downvote">▼</button>
                    </div>
                    <div class="post-content">
                        <div class="post-header">
                            <span class="post-rank">${index + 1}.</span>
                            <h3 class="post-title">
                                ${post.url ? 
                                    `<a href="${post.url}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(post.title)}</a>
                                     <span class="post-url">(${domain})</span>` :
                                    `<a href="#post-${post.id}">${this.escapeHtml(post.title)}</a>`
                                }
                            </h3>
                            <span class="post-category">${post.category}</span>
                        </div>
                        ${post.text ? `<p style="margin-top: 8px; color: #5a6c7d; font-size: 14px;">${this.escapeHtml(post.text.substring(0, 200))}${post.text.length > 200 ? '...' : ''}</p>` : ''}
                        <div class="post-meta">
                            by <a href="#user-${post.author}">${post.author}</a> | 
                            ${timeAgo} | 
                            <a href="#comments-${post.id}">${post.comments} comments</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch (e) {
            return '';
        }
    }

    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return `${seconds} seconds ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const app = new KinonewsApp();
