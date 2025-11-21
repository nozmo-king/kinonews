// State
let currentUser = null;
let currentPage = 'home';
let isLoginMode = true;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadPage('home');
  setupAuthForm();
});

// Auth functions
async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    currentUser = data.user;
    updateUserNav();
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

function updateUserNav() {
  const userNav = document.getElementById('userNav');
  if (currentUser) {
    userNav.innerHTML = `
      <a href="/user/${currentUser.username}" onclick="loadPage('user', '${currentUser.username}'); return false;">
        ${currentUser.username} (${currentUser.karma})
      </a>
      |
      <a href="#" onclick="logout(); return false;">logout</a>
    `;
  } else {
    userNav.innerHTML = '<a href="#" onclick="openAuthModal(true); return false;">login</a>';
  }
}

function openAuthModal(isLogin) {
  isLoginMode = isLogin;
  const modal = document.getElementById('authModal');
  const title = document.getElementById('authModalTitle');
  const emailGroup = document.getElementById('emailGroup');
  const toggleLink = document.getElementById('toggleAuth');

  title.textContent = isLogin ? 'Sign In' : 'Create Account';
  emailGroup.style.display = isLogin ? 'none' : 'block';
  toggleLink.textContent = isLogin ? 'Create account' : 'Sign in';

  document.getElementById('authError').textContent = '';
  document.getElementById('authForm').reset();

  modal.style.display = 'block';
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
}

function toggleAuthMode() {
  openAuthModal(!isLoginMode);
}

function setupAuthForm() {
  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('authUsername').value;
    const password = document.getElementById('authPassword').value;
    const email = document.getElementById('authEmail').value;

    const endpoint = isLoginMode ? '/api/login' : '/api/register';
    const body = isLoginMode ? { username, password } : { username, password, email };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        currentUser = data.user;
        closeAuthModal();
        updateUserNav();
        loadPage('home');
      } else {
        document.getElementById('authError').textContent = data.error || 'Authentication failed';
      }
    } catch (error) {
      document.getElementById('authError').textContent = 'Network error. Please try again.';
    }
  });
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    updateUserNav();
    loadPage('home');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// Navigation
function loadPage(page, param) {
  currentPage = page;
  const mainContent = document.getElementById('mainContent');

  switch (page) {
    case 'home':
    case 'new':
      loadPosts();
      break;
    case 'submit':
      showSubmitForm();
      break;
    case 'post':
      loadPost(param);
      break;
    case 'user':
      loadUser(param);
      break;
    default:
      mainContent.innerHTML = '<div class="empty-state">Page not found</div>';
  }
}

// Posts
async function loadPosts() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const response = await fetch('/api/posts');
    const data = await response.json();

    if (data.posts.length === 0) {
      mainContent.innerHTML = '<div class="empty-state">No posts yet. Be the first to submit!</div>';
      return;
    }

    let html = '<div class="post-list">';
    data.posts.forEach((post, index) => {
      const domain = post.url ? new URL(post.url).hostname.replace('www.', '') : '';
      const timeAgo = formatTimeAgo(post.created_at);

      html += `
        <div class="post-item">
          <div class="post-rank">${index + 1}.</div>
          <div class="post-vote">
            <button class="vote-btn" onclick="vote(${post.id}, null, 1)" ${!currentUser ? 'disabled' : ''}>▲</button>
          </div>
          <div class="post-content">
            <div class="post-title">
              ${post.url
                ? `<a href="${post.url}" target="_blank" rel="noopener">${escapeHtml(post.title)}</a>`
                : `<a href="/post/${post.id}" onclick="loadPage('post', ${post.id}); return false;">${escapeHtml(post.title)}</a>`
              }
              ${domain ? `<span class="post-domain">(${domain})</span>` : ''}
            </div>
            <div class="post-meta">
              ${post.points} points by ${post.username} ${timeAgo} |
              <a href="/post/${post.id}" onclick="loadPage('post', ${post.id}); return false;">
                ${post.comment_count} comments
              </a>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    mainContent.innerHTML = html;
  } catch (error) {
    mainContent.innerHTML = '<div class="error">Failed to load posts</div>';
  }
}

async function loadPost(postId) {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const response = await fetch(`/api/posts/${postId}`);
    const data = await response.json();

    if (!response.ok) {
      mainContent.innerHTML = '<div class="error">Post not found</div>';
      return;
    }

    const post = data.post;
    const timeAgo = formatTimeAgo(post.created_at);

    let html = `
      <div class="post-detail">
        <div class="post-detail-header">
          <div class="post-detail-title">
            ${post.url
              ? `<a href="${post.url}" target="_blank" rel="noopener">${escapeHtml(post.title)}</a>`
              : escapeHtml(post.title)
            }
          </div>
          <div class="post-meta">
            ${post.points} points by ${post.username} ${timeAgo}
          </div>
          ${post.text ? `<div class="post-detail-text">${escapeHtml(post.text).replace(/\n/g, '<br>')}</div>` : ''}
        </div>
    `;

    if (currentUser) {
      html += `
        <div class="comment-form">
          <form onsubmit="submitComment(${post.id}, null); return false;">
            <textarea id="commentText" placeholder="Add a comment..." required></textarea>
            <div style="margin-top: 10px;">
              <button type="submit" class="btn-primary">Add Comment</button>
            </div>
          </form>
        </div>
      `;
    }

    html += '<div class="comments-list">';

    if (data.comments.length > 0) {
      const commentTree = buildCommentTree(data.comments);
      html += renderComments(commentTree, post.id);
    } else {
      html += '<div class="empty-state">No comments yet.</div>';
    }

    html += '</div></div>';

    mainContent.innerHTML = html;
  } catch (error) {
    mainContent.innerHTML = '<div class="error">Failed to load post</div>';
  }
}

function buildCommentTree(comments) {
  const commentMap = {};
  const roots = [];

  comments.forEach(comment => {
    comment.children = [];
    commentMap[comment.id] = comment;
  });

  comments.forEach(comment => {
    if (comment.parent_id) {
      const parent = commentMap[comment.parent_id];
      if (parent) {
        parent.children.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

function renderComments(comments, postId, depth = 0) {
  let html = '';

  comments.forEach(comment => {
    const timeAgo = formatTimeAgo(comment.created_at);
    const nested = depth > 0 ? 'nested' : '';

    html += `
      <div class="comment ${nested}">
        <div class="comment-meta">
          ${comment.username} ${timeAgo} | ${comment.points} points
        </div>
        <div class="comment-text">${escapeHtml(comment.text).replace(/\n/g, '<br>')}</div>
        <div class="comment-actions">
          ${currentUser ? `<a href="#" onclick="toggleReplyForm(${comment.id}); return false;">reply</a>` : ''}
          ${currentUser ? `<a href="#" onclick="vote(null, ${comment.id}, 1); return false;">upvote</a>` : ''}
        </div>
        <div id="replyForm${comment.id}" style="display: none; margin-top: 10px;">
          <form onsubmit="submitComment(${postId}, ${comment.id}); return false;">
            <textarea id="replyText${comment.id}" style="width: 100%; max-width: 500px; min-height: 60px;" required></textarea>
            <div style="margin-top: 5px;">
              <button type="submit" class="btn-primary">Reply</button>
              <a href="#" onclick="toggleReplyForm(${comment.id}); return false;" style="margin-left: 10px;">cancel</a>
            </div>
          </form>
        </div>
        ${comment.children.length > 0 ? renderComments(comment.children, postId, depth + 1) : ''}
      </div>
    `;
  });

  return html;
}

function toggleReplyForm(commentId) {
  const form = document.getElementById(`replyForm${commentId}`);
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function submitComment(postId, parentId) {
  const textId = parentId ? `replyText${parentId}` : 'commentText';
  const text = document.getElementById(textId).value;

  if (!text.trim()) return;

  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, parentId, text })
    });

    if (response.ok) {
      loadPost(postId);
    } else {
      alert('Failed to submit comment');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Submit form
function showSubmitForm() {
  if (!currentUser) {
    openAuthModal(true);
    return;
  }

  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="submit-form">
      <h2>Submit</h2>
      <form onsubmit="submitPost(); return false;">
        <div class="form-group">
          <label for="postTitle">Title:</label>
          <input type="text" id="postTitle" required>
        </div>
        <div class="form-group">
          <label for="postUrl">URL (optional):</label>
          <input type="url" id="postUrl">
          <div class="form-hint">Link to a movie, review, article, or discussion</div>
        </div>
        <div class="form-group">
          <label for="postText">Text (optional):</label>
          <textarea id="postText"></textarea>
          <div class="form-hint">If there's no URL, this text will be the body of the post</div>
        </div>
        <button type="submit" class="btn-primary">Submit</button>
        <div id="submitError" class="error"></div>
      </form>
    </div>
  `;
}

async function submitPost() {
  const title = document.getElementById('postTitle').value;
  const url = document.getElementById('postUrl').value;
  const text = document.getElementById('postText').value;

  if (!title.trim()) {
    document.getElementById('submitError').textContent = 'Title is required';
    return;
  }

  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url, text })
    });

    const data = await response.json();

    if (response.ok) {
      loadPage('post', data.postId);
    } else {
      document.getElementById('submitError').textContent = data.error || 'Failed to submit post';
    }
  } catch (error) {
    document.getElementById('submitError').textContent = 'Network error. Please try again.';
  }
}

// Vote
async function vote(postId, commentId, voteType) {
  if (!currentUser) {
    openAuthModal(true);
    return;
  }

  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, commentId, voteType })
    });

    if (response.ok) {
      if (currentPage === 'post' && postId) {
        loadPost(postId);
      } else {
        loadPosts();
      }
    }
  } catch (error) {
    console.error('Vote failed:', error);
  }
}

// User profile
async function loadUser(username) {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const response = await fetch(`/api/user/${username}`);
    const data = await response.json();

    if (!response.ok) {
      mainContent.innerHTML = '<div class="error">User not found</div>';
      return;
    }

    const joinedDate = new Date(data.created_at).toLocaleDateString();

    mainContent.innerHTML = `
      <div class="user-profile">
        <h2>User: ${data.username}</h2>
        <div class="user-info">
          <div><span class="user-info-label">Karma:</span> ${data.karma}</div>
          <div><span class="user-info-label">Joined:</span> ${joinedDate}</div>
        </div>
      </div>
    `;
  } catch (error) {
    mainContent.innerHTML = '<div class="error">Failed to load user</div>';
  }
}

// Utilities
function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('authModal');
  if (event.target === modal) {
    closeAuthModal();
  }
};
