requireAuth();

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

        // Injected in navbar usually, but can be used here too if element exists
        const alertBadge = document.getElementById('alertBadge');
        if (alertBadge) {
            if (unreadCount > 0) {
                alertBadge.textContent = unreadCount;
                alertBadge.classList.remove('hidden');
            } else {
                alertBadge.classList.add('hidden');
            }
        }

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

// Note: userName setting is now handled in ui.js

function displayRecentTransactions(transactions) {
    const tbody = document.getElementById('recentTransactions');

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-slate-400 font-medium tracking-tight">No transactions yet</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const dateObj = new Date(t.timestamp);
        const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const isIN = t.type === 'IN';
        const typeClass = isIN
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            : 'bg-amber-50 text-amber-600 border border-amber-100';

        return `
            <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                <td class="py-4">
                    <p class="font-bold text-slate-900">${date}</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">${time}</p>
                </td>
                <td class="py-4">
                    <p class="font-bold text-slate-700">${t.part_name || 'Unknown'}</p>
                </td>
                <td class="py-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${typeClass}">
                        ${t.type}
                    </span>
                </td>
                <td class="py-4 text-center">
                    <span class="text-sm font-black ${isIN ? 'text-emerald-600' : 'text-amber-600'}">${isIN ? '+' : '-'}${t.quantity}</span>
                </td>
                <td class="py-4">
                    <div class="flex items-center">
                        <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-[10px] text-slate-500 border border-slate-200">
                            ${(t.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span class="text-xs font-bold text-slate-600">${t.user_name || 'Unknown'}</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Load data on page load
loadDashboardData();

// Auto-refresh every 30 seconds
setInterval(loadDashboardData, 30000);
