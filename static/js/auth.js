/**
 * Login user
 */
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user info
            console.log('Auth.js: Success, saving user to storage:', data.user);
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error:', error);
        return { success: false, error: 'Connection error' };
    }
}

/**
 * Register user
 */
async function signup(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user info
            console.log('Auth.js: Success, saving user to storage:', data.user);
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error:', error);
        return { success: false, error: 'Connection error' };
    }
}

/**
 * Logout user
 */
function logout() {
    console.log('Logging out...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.replace('/');
}

// Ensure logout is globally accessible
window.logout = logout;

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!localStorage.getItem('access_token');
}

/**
 * Check if user is admin
 */
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

/**
 * Protect page (redirect to login if not authenticated)
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/';
        return false;
    }
    return true;
}

/**
 * Require admin role
 */
function requireAdmin() {
    if (!isAuthenticated()) {
        window.location.href = '/';
        return false;
    }

    if (!isAdmin()) {
        alert('Admin access required');
        window.location.href = '/dashboard.html';
        return false;
    }

    return true;
}
