requireAuth();

// Note: userName setting is now handled in ui.js

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
        container.innerHTML = `
            <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-20 text-center border border-slate-100">
                <div class="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </div>
                <h3 class="text-2xl font-bold text-slate-900 mb-2">Inventory is healthy!</h3>
                <p class="text-slate-400 font-medium">No low stock alerts at the moment.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = alerts.map(alert => {
        const dateObj = new Date(alert.created_at);
        const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const isSeen = alert.seen;
        const bgClass = isSeen ? 'opacity-60 grayscale-[0.5]' : '';
        const borderClass = isSeen ? 'border-zinc-100' : 'border-rose-100 shadow-rose-100/50';

        return `
            <div class="bg-white rounded-2xl shadow-lg ${borderClass} border p-6 flex items-start justify-between transition-all hover:scale-[1.01] ${bgClass}">
                <div class="flex items-start space-x-5 flex-1">
                    <div class="w-12 h-12 ${isSeen ? 'bg-slate-100 text-slate-400' : 'bg-rose-50 text-rose-500'} rounded-xl flex items-center justify-center shrink-0">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-3 mb-1">
                            <h3 class="font-extrabold text-slate-900 truncate">${alert.part_name || 'Unknown Part'}</h3>
                            ${!isSeen ? '<span class="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full pulse">New</span>' : ''}
                        </div>
                        <p class="text-slate-600 font-medium mb-3">${alert.message}</p>
                        <div class="flex items-center text-xs font-bold text-slate-400 space-x-3">
                            <span class="flex items-center">
                                <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                ${date}
                            </span>
                            <span class="flex items-center">
                                <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                ${time}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="ml-6 shrink-0">
                    ${!isSeen ? `
                        <button onclick="markAsRead(${alert.id})" class="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl transition">
                            Dismiss
                        </button>
                    ` : `
                        <span class="text-xs font-bold text-slate-300 uppercase tracking-widest">Seen</span>
                    `}
                </div>
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
