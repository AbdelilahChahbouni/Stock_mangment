function injectSidebar() {
    const sidebarHTML = `
        <div class="sidebar glass border-r shadow-xl">
            <div class="p-8">
                <div class="flex items-center space-x-3 mb-10">
                    <div class="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                    </div>
                    <span class="text-xl font-bold tracking-tight">StockSphere</span>
                </div>
                
                <nav class="space-y-2">
                    <a href="/dashboard.html" class="sidebar-link ${window.location.pathname.includes('dashboard') ? 'active' : ''}">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                        Dashboard
                    </a>
                    <a href="/parts.html" class="sidebar-link ${window.location.pathname.includes('parts') ? 'active' : ''}">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        Inventory
                    </a>
                    <a href="/transactions.html" class="sidebar-link ${window.location.pathname.includes('transactions') ? 'active' : ''}">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        Transactions
                    </a>
                    <a href="/suppliers.html" class="sidebar-link ${window.location.pathname.includes('suppliers') ? 'active' : ''}">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        Suppliers
                    </a>
                    <a href="/alerts.html" class="sidebar-link ${window.location.pathname.includes('alerts') ? 'active' : ''}">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                        </svg>
                        Alerts
                    </a>
                    <a href="/analytics.html" class="sidebar-link ${window.location.pathname.includes('analytics') ? 'active' : ''}">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Analytics
                    </a>
                </nav>
            </div>
            
            <div class="absolute bottom-0 w-full p-8 border-t border-slate-100">
                <button onclick="logout()" class="flex items-center text-slate-500 hover:text-red-500 transition">
                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Logout
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
}

function injectNavbar(pageTitle) {
    const navbarHTML = `
        <header class="flex items-center justify-between mb-10">
            <div>
                <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">${pageTitle}</h2>
                <p class="text-slate-500 font-medium mt-1" id="navbarSubtitle">Management Dashboard</p>
            </div>
            
            <div class="flex items-center space-x-6">
                <div class="flex items-center space-x-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-blue-200">
                    <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-extrabold" id="userInitial">U</div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1" id="navbarUserRole">User</p>
                        <p class="text-sm font-bold text-slate-900 leading-none" id="navbarUserName">Connected User</p>
                    </div>
                </div>
            </div>
        </header>
    `;

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertAdjacentHTML('afterbegin', navbarHTML);
        updateUserInfo();
    }
}

/**
 * Update all user-related elements in the DOM
 */
function updateUserInfo() {
    console.log('UI.js: Updating user info...');
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        console.warn('UI.js: No user found in localStorage');
        return;
    }

    try {
        const user = JSON.parse(userStr);
        console.log('UI.js: Found user:', user);

        // Update Usernames (including navbar and any on-page spans)
        const nameElements = document.querySelectorAll('#navbarUserName, #userName');
        nameElements.forEach(el => {
            el.textContent = user.username;
        });

        // Update Roles
        const roleElements = document.querySelectorAll('#navbarUserRole');
        roleElements.forEach(el => {
            el.textContent = user.role || 'User';
        });

        // Update Initials
        const initialElements = document.querySelectorAll('#userInitial');
        if (user.username) {
            const initial = user.username.charAt(0).toUpperCase();
            initialElements.forEach(el => {
                el.textContent = initial;
            });
        }
    } catch (e) {
        console.error('UI.js: Failed to parse user data', e);
    }
}

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const isAuthPage = path === '/' || path === '/index.html' || path === '/register.html';

    if (!isAuthPage) {
        injectSidebar();
        // Info will be updated by injectNavbar or this final call
        updateUserInfo();
    }
});
