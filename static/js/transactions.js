requireAuth();

const user = getCurrentUser();
document.getElementById('userName').textContent = `${user.username} (${user.role})`;

let allTransactions = [];

async function loadTransactions() {
    try {
        const data = await apiGet('/api/transactions?limit=500');
        allTransactions = data.transactions || [];
        filterAndDisplayTransactions();
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

function filterAndDisplayTransactions() {
    const typeFilter = document.getElementById('typeFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    let filtered = allTransactions.filter(t => {
        const matchesType = !typeFilter || t.type === typeFilter;

        let matchesDate = true;
        if (startDate || endDate) {
            const tDate = new Date(t.timestamp).toISOString().split('T')[0];
            if (startDate && tDate < startDate) matchesDate = false;
            if (endDate && tDate > endDate) matchesDate = false;
        }

        return matchesType && matchesDate;
    });

    displayTransactions(filtered);
}

function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionsTableBody');

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No transactions found</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const date = new Date(t.timestamp).toLocaleString();
        const typeClass = t.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-600">${date}</td>
                <td class="px-4 py-3 font-medium">${t.part_name || 'Unknown'}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${typeClass}">${t.type}</span>
                </td>
                <td class="px-4 py-3 text-sm font-semibold">${t.quantity}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${t.machine || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${t.user_name || 'Unknown'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${t.notes || '-'}</td>
            </tr>
        `;
    }).join('');
}

function exportCSV() {
    const typeFilter = document.getElementById('typeFilter').value;
    const filtered = typeFilter ? allTransactions.filter(t => t.type === typeFilter) : allTransactions;

    const headers = ['Date', 'Part', 'Type', 'Quantity', 'Machine', 'User', 'Notes'];
    const rows = filtered.map(t => [
        new Date(t.timestamp).toLocaleString(),
        t.part_name || 'Unknown',
        t.type,
        t.quantity,
        t.machine || '',
        t.user_name || 'Unknown',
        t.notes || ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

document.getElementById('typeFilter').addEventListener('change', filterAndDisplayTransactions);
document.getElementById('startDate').addEventListener('change', filterAndDisplayTransactions);
document.getElementById('endDate').addEventListener('change', filterAndDisplayTransactions);

loadTransactions();
