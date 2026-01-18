requireAuth();

const user = getCurrentUser();
document.getElementById('userName').textContent = `${user.username} (${user.role})`;

async function loadAlerts() {
    try {
        const data = await apiGet('/api/alerts');
        const alerts = data.alerts || [];
        displayAlerts(alerts);
    } catch (error) {
        console.error('Failed to load alerts:', error);
    }
}

function displayAlerts(alerts) {
    const container = document.getElementById('alertsList');

    if (alerts.length === 0) {
        container.innerHTML = '<div class="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">No alerts</div>';
        return;
    }

    container.innerHTML = alerts.map(alert => {
        const date = new Date(alert.created_at).toLocaleString();
        const bgClass = alert.seen ? 'bg-gray-50' : 'bg-red-50 border-l-4 border-red-500';
        const iconClass = alert.seen ? 'text-gray-400' : 'text-red-600';

        return `
            <div class="${bgClass} rounded-xl shadow-md p-6 flex items-start justify-between">
                <div class="flex items-start space-x-4 flex-1">
                    <div class="p-3 bg-white rounded-full">
                        <svg class="w-6 h-6 ${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800 mb-1">${alert.part_name || 'Unknown Part'}</h3>
                        <p class="text-gray-600 text-sm mb-2">${alert.message}</p>
                        <p class="text-xs text-gray-500">${date}</p>
                    </div>
                </div>
                ${!alert.seen ? `
                    <button onclick="markAsRead(${alert.id})" class="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Mark as Read
                    </button>
                ` : '<span class="ml-4 text-xs text-gray-500">Read</span>'}
            </div>
        `;
    }).join('');
}

async function markAsRead(alertId) {
    try {
        await apiPut(`/api/alerts/${alertId}/mark-read`, {});
        loadAlerts();
    } catch (error) {
        console.error('Failed to mark alert as read:', error);
    }
}

async function markAllRead() {
    try {
        await apiPut('/api/alerts/mark-all-read', {});
        loadAlerts();
    } catch (error) {
        console.error('Failed to mark all alerts as read:', error);
    }
}

loadAlerts();
