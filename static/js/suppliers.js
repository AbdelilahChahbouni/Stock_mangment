requireAuth();

let allSuppliers = [];

async function loadSuppliers() {
    try {
        const data = await apiGet('/api/suppliers');
        allSuppliers = data.suppliers || [];
        displaySuppliers(allSuppliers);
    } catch (error) {
        console.error('Failed to load suppliers:', error);
    }
}

function displaySuppliers(suppliers) {
    const tbody = document.getElementById('suppliersTableBody');

    if (suppliers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-20 text-center text-slate-400 font-medium tracking-tight">No suppliers found. Start by adding one.</td></tr>';
        return;
    }

    tbody.innerHTML = suppliers.map(s => `
        <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors">
            <td class="py-4 font-extrabold text-slate-900">${s.name}</td>
            <td class="py-4">
                <span class="text-sm font-bold text-slate-600">${s.contact_person || '-'}</span>
            </td>
            <td class="py-4">
                <a href="mailto:${s.email}" class="text-sm font-bold text-blue-600 hover:underline">${s.email || '-'}</a>
            </td>
            <td class="py-4">
                <span class="text-sm font-bold text-slate-500">${s.phone || '-'}</span>
            </td>
            <td class="py-4">
                <span class="text-xs font-medium text-slate-400 max-w-[200px] truncate block" title="${s.address || ''}">${s.address || '-'}</span>
            </td>
            <td class="py-4 text-right">
                <div class="flex justify-end space-x-2">
                    <button onclick="openEditSupplierModal(${s.id})" 
                        class="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition shadow-sm border border-blue-100">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                    <button onclick="deleteSupplier(${s.id})" 
                        class="p-2 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition shadow-sm border border-rose-100">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddSupplierModal() {
    document.getElementById('modalTitle').textContent = 'Add New Supplier';
    document.getElementById('supplierId').value = '';
    document.getElementById('supplierForm').reset();
    document.getElementById('supplierModal').classList.remove('hidden');
}

function closeSupplierModal() {
    document.getElementById('supplierModal').classList.add('hidden');
}

async function openEditSupplierModal(id) {
    const supplier = allSuppliers.find(s => s.id === id);
    if (!supplier) return;

    document.getElementById('modalTitle').textContent = 'Edit Supplier';
    document.getElementById('supplierId').value = supplier.id;
    document.getElementById('name').value = supplier.name || '';
    document.getElementById('contact_person').value = supplier.contact_person || '';
    document.getElementById('email').value = supplier.email || '';
    document.getElementById('phone').value = supplier.phone || '';
    document.getElementById('address').value = supplier.address || '';

    document.getElementById('supplierModal').classList.remove('hidden');
}

document.getElementById('supplierForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('supplierId').value;
    const data = {
        name: document.getElementById('name').value,
        contact_person: document.getElementById('contact_person').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
    };

    try {
        if (id) {
            await apiPut(`/api/suppliers/${id}`, data);
        } else {
            await apiPost('/api/suppliers', data);
        }
        closeSupplierModal();
        loadSuppliers();
    } catch (error) {
        alert(error.message || 'Operation failed');
    }
});

async function deleteSupplier(id) {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
        await apiDelete(`/api/suppliers/${id}`);
        loadSuppliers();
    } catch (error) {
        alert(error.message || 'Failed to delete supplier. Check if it has associated parts.');
    }
}

loadSuppliers();
