// Protect page
requireAuth();

// Display user name
const user = getCurrentUser();
document.getElementById('userName').textContent = `${user.username} (${user.role})`;

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load parts
        const partsData = await apiGet('/api/parts');
        const parts = partsData.parts || [];

        // Update stats
        document.getElementById('totalParts').textContent = parts.length;

        // Count low stock
        const lowStockParts = parts.filter(p => p.is_low_stock);
        document.getElementById('lowStockCount').textContent = lowStockParts.length;

        // Load transactions
        const transData = await apiGet('/api/transactions?limit=10');
        const transactions = transData.transactions || [];

        // Calculate today's IN/OUT
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = transactions.filter(t =>
            t.timestamp && t.timestamp.startsWith(today)
        );

        const stockIn = todayTransactions
            .filter(t => t.type === 'IN')
            .reduce((sum, t) => sum + t.quantity, 0);

        const stockOut = todayTransactions
            .filter(t => t.type === 'OUT')
            .reduce((sum, t) => sum + t.quantity, 0);

        document.getElementById('stockInToday').textContent = stockIn;
        document.getElementById('stockOutToday').textContent = stockOut;

        // Display recent transactions
        displayRecentTransactions(transactions.slice(0, 10));

        // Load alert count
        const alertsData = await apiGet('/api/alerts/unread-count');
        const unreadCount = alertsData.unread_count || 0;

        if (unreadCount > 0) {
            const badge = document.getElementById('alertBadge');
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function displayRecentTransactions(transactions) {
    const tbody = document.getElementById('recentTransactions');

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No transactions yet</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const date = new Date(t.timestamp).toLocaleString();
        const typeClass = t.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-600">${date}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-800">${t.part_name || 'Unknown'}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${typeClass}">
                        ${t.type}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">${t.quantity}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${t.user_name || 'Unknown'}</td>
            </tr>
        `;
    }).join('');
}

// Load data on page load
loadDashboardData();

// Auto-refresh every 30 seconds
setInterval(loadDashboardData, 30000);
