requireAuth();

// Note: userName setting is now handled in ui.js

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
        tbody.innerHTML = '<tr><td colspan="7" class="py-10 text-center text-slate-400 font-medium tracking-tight">No transactions found for the selected criteria</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const dateObj = new Date(t.timestamp);
        const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const isIN = t.type === 'IN';
        const typeClass = isIN
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            : 'bg-amber-50 text-amber-600 border border-amber-100';

        return `
            <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                <td class="py-4">
                    <p class="font-bold text-slate-900">${date}</p>
                    <p class="text-xs text-slate-400 font-medium">${time}</p>
                </td>
                <td class="py-4">
                    <p class="font-bold text-slate-700">${t.part_name || 'Unknown'}</p>
                </td>
                <td class="py-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-extrabold tracking-wider ${typeClass}">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${isIN ? '<path d="M7 11l5-5m0 0l5 5m-5-5v12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>' : '<path d="M17 13l-5 5m0 0l-5-5m5 5V6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>'}
                        </svg>
                        ${t.type}
                    </span>
                </td>
                <td class="py-4">
                    <span class="text-lg font-extrabold ${isIN ? 'text-emerald-600' : 'text-amber-600'}">${isIN ? '+' : '-'}${t.quantity}</span>
                </td>
                <td class="py-4">
                    <span class="text-sm font-bold text-slate-500">${t.machine || '-'}</span>
                </td>
                <td class="py-4 font-semibold text-slate-600">
                    <div class="flex items-center">
                        <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-[10px] text-slate-500 border border-slate-200">${(t.user_name || 'U').charAt(0).toUpperCase()}</div>
                        ${t.user_name || 'Unknown'}
                    </div>
                </td>
                <td class="py-4">
                    <p class="text-sm text-slate-400 italic max-w-xs truncate" title="${t.notes || ''}">${t.notes || '-'}</p>
                </td>
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

// Transaction Modal Functions
let allParts = [];

async function loadParts() {
    try {
        const data = await apiGet('/api/parts');
        allParts = data.parts || [];
        populatePartsDropdown();
    } catch (error) {
        console.error('Failed to load parts:', error);
    }
}

function populatePartsDropdown() {
    const select = document.getElementById('transactionPartId');
    const currentValue = select.value;

    select.innerHTML = '<option value="">Select a part...</option>';

    allParts.forEach(part => {
        const option = document.createElement('option');
        option.value = part.id;
        option.textContent = `${part.name} (Available: ${part.quantity})`;
        select.appendChild(option);
    });

    if (currentValue) {
        select.value = currentValue;
    }
}

function openTransactionModal() {
    loadParts(); // Refresh parts list
    document.getElementById('transactionModal').classList.remove('hidden');
    document.getElementById('transactionForm').reset();
}

function closeTransactionModal() {
    document.getElementById('transactionModal').classList.add('hidden');
}

async function submitTransaction(event) {
    event.preventDefault();

    const partId = document.getElementById('transactionPartId').value;
    const type = document.querySelector('input[name="transactionType"]:checked').value;
    const quantity = parseInt(document.getElementById('transactionQuantity').value);
    const machine = document.getElementById('transactionMachine').value.trim();
    const notes = document.getElementById('transactionNotes').value.trim();

    if (!partId || !quantity || quantity <= 0) {
        alert('Please fill in all required fields with valid values');
        return;
    }

    // Check if trying to remove more stock than available
    if (type === 'OUT') {
        const part = allParts.find(p => p.id == partId);
        if (part && part.quantity < quantity) {
            alert(`Insufficient stock! Available: ${part.quantity}, Requested: ${quantity}`);
            return;
        }
    }

    const endpoint = type === 'IN' ? '/api/transactions/in' : '/api/transactions/out';
    const payload = {
        part_id: parseInt(partId),
        quantity: quantity,
        machine: machine,
        notes: notes
    };

    try {
        const result = await apiPost(endpoint, payload);

        // Show success message
        alert(`Stock ${type} transaction created successfully!`);

        // Close modal and refresh transactions
        closeTransactionModal();
        await loadTransactions();

    } catch (error) {
        console.error('Failed to create transaction:', error);
        alert(error.message || 'Failed to create transaction. Please try again.');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('transactionModal');
    if (e.target === modal) {
        closeTransactionModal();
    }
});
