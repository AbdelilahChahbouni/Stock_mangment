requireAuth();

// Note: userName setting is now handled in ui.js

// Chart instances
let categoryChart, locationChart, topPartsChart, criticalPartsChart;

// StockSphere Color Palette
const colors = {
    primary: ['#0061FF', '#60EFFF', '#3b82f6', '#1d4ed8', '#1e3a8a'],
    success: ['#10b981', '#34d399', '#059669', '#047857', '#064e3b'],
    warning: ['#f59e0b', '#fbbf24', '#d97706', '#b45309', '#78350f'],
    danger: ['#ef4444', '#f87171', '#dc2626', '#b91c1c', '#7f1d1d'],
    info: ['#0ea5e9', '#38bdf8', '#0284c7', '#0369a1', '#0c4a6e']
};

// Global Chart Defaults
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#64748b';
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.borderRadius = 12;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
Chart.defaults.elements.bar.borderRadius = 8;
Chart.defaults.elements.arc.borderWidth = 0;

// Load all analytics data
async function loadAnalytics() {
    try {
        await Promise.all([
            loadOverview(),
            loadStockDistribution(),
            loadLowStockAnalysis(),
            loadTopParts()
        ]);
    } catch (error) {
        console.error('Failed to load analytics:', error);
    }
}

// Load overview statistics
async function loadOverview() {
    try {
        const data = await apiGet('/api/analytics/overview');

        document.getElementById('totalParts').textContent = data.total_parts;
        document.getElementById('lowStockCount').textContent = data.low_stock_count;
        document.getElementById('totalQuantity').textContent = data.total_quantity;
        document.getElementById('activeAlerts').textContent = data.unread_alerts;
    } catch (error) {
        console.error('Failed to load overview:', error);
    }
}

// Load stock distribution and create charts
async function loadStockDistribution() {
    try {
        const data = await apiGet('/api/analytics/stock-distribution');

        // Category chart
        const categoryData = data.by_category;
        if (categoryChart) categoryChart.destroy();

        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categoryData.map(c => c.category),
                datasets: [{
                    data: categoryData.map(c => c.total_quantity),
                    backgroundColor: colors.primary,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Location chart
        const locationData = data.by_location;
        if (locationChart) locationChart.destroy();

        const locationCtx = document.getElementById('locationChart').getContext('2d');
        locationChart = new Chart(locationCtx, {
            type: 'bar',
            data: {
                labels: locationData.map(l => l.location),
                datasets: [{
                    label: 'Total Quantity',
                    data: locationData.map(l => l.total_quantity),
                    backgroundColor: colors.info[0],
                    borderColor: colors.info[1],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to load stock distribution:', error);
    }
}

// Load low stock analysis
async function loadLowStockAnalysis() {
    try {
        const data = await apiGet('/api/analytics/low-stock');
        const tbody = document.getElementById('lowStockTableBody');

        if (data.low_stock_parts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No low stock items</td></tr>';
            return;
        }

        tbody.innerHTML = data.low_stock_parts.map(part => {
            const isCritical = part.stock_percentage <= 25;
            const isVeryLow = part.stock_percentage <= 50;

            let statusClass, statusText;
            if (isCritical) {
                statusClass = 'bg-rose-50 text-rose-600 border border-rose-100';
                statusText = 'Critical';
            } else if (isVeryLow) {
                statusClass = 'bg-amber-50 text-amber-600 border border-amber-100';
                statusText = 'Very Low';
            } else {
                statusClass = 'bg-blue-50 text-blue-600 border border-blue-100';
                statusText = 'Low';
            }

            return `
                <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                    <td class="py-4 font-bold text-slate-900">${part.name}</td>
                    <td class="py-4">
                        <span class="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">${part.category || 'General'}</span>
                    </td>
                    <td class="py-4">
                        <span class="text-sm font-bold text-slate-500">${part.location || '-'}</span>
                    </td>
                    <td class="py-4">
                        <span class="text-lg font-extrabold text-slate-900">${part.quantity}</span>
                    </td>
                    <td class="py-4">
                        <span class="text-sm font-bold text-slate-400">${part.min_quantity}</span>
                    </td>
                    <td class="py-4">
                        <span class="text-sm font-extrabold text-rose-600">${part.deficit}</span>
                    </td>
                    <td class="py-4">
                        <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase ${statusClass}">
                             <span class="w-1.5 h-1.5 rounded-full mr-2 ${isCritical ? 'bg-rose-500 animate-pulse' : (isVeryLow ? 'bg-amber-500' : 'bg-blue-500')}"></span>
                            ${statusText}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load low stock analysis:', error);
    }
}

// Load top parts
async function loadTopParts() {
    try {
        const data = await apiGet('/api/analytics/top-parts');

        // Top parts by quantity chart
        const topParts = data.top_by_quantity;
        if (topPartsChart) topPartsChart.destroy();

        const topPartsCtx = document.getElementById('topPartsChart').getContext('2d');
        topPartsChart = new Chart(topPartsCtx, {
            type: 'bar',
            data: {
                labels: topParts.map(p => p.name),
                datasets: [{
                    label: 'Quantity',
                    data: topParts.map(p => p.quantity),
                    backgroundColor: colors.success[0],
                    borderColor: colors.success[1],
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });

        // Critical parts chart
        const criticalParts = data.most_critical;
        if (criticalPartsChart) criticalPartsChart.destroy();

        const criticalPartsCtx = document.getElementById('criticalPartsChart').getContext('2d');
        criticalPartsChart = new Chart(criticalPartsCtx, {
            type: 'bar',
            data: {
                labels: criticalParts.map(p => p.name),
                datasets: [{
                    label: 'Stock %',
                    data: criticalParts.map(p => p.stock_percentage),
                    backgroundColor: criticalParts.map(p => {
                        if (p.stock_percentage <= 25) return colors.danger[0];
                        if (p.stock_percentage <= 50) return colors.warning[0];
                        return colors.warning[1];
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `Stock Level: ${context.parsed.x.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to load top parts:', error);
    }
}

// Load analytics on page load
loadAnalytics();
