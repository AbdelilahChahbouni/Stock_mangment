requireAuth();

const user = getCurrentUser();
document.getElementById('userName').textContent = `${user.username} (${user.role})`;

// Chart instances
let categoryChart, locationChart, topPartsChart, criticalPartsChart;

// Color palettes
const colors = {
    primary: ['#9333EA', '#7C3AED', '#6366F1', '#4F46E5', '#4338CA'],
    success: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
    warning: ['#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F'],
    danger: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'],
    info: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A']
};

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
            let statusClass, statusText;
            if (part.stock_percentage <= 25) {
                statusClass = 'bg-red-100 text-red-800';
                statusText = 'Critical';
            } else if (part.stock_percentage <= 50) {
                statusClass = 'bg-orange-100 text-orange-800';
                statusText = 'Very Low';
            } else {
                statusClass = 'bg-yellow-100 text-yellow-800';
                statusText = 'Low';
            }

            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium">${part.name}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${part.category || '-'}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${part.location || '-'}</td>
                    <td class="px-4 py-3 text-sm font-semibold">${part.quantity}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${part.min_quantity}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-red-600">${part.deficit}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">${statusText}</span>
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
