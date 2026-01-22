requireAuth();

const user = getCurrentUser();
document.getElementById('userName').textContent = `${user.username} (${user.role})`;

// Hide add button for non-admins (Disabled)
// if (!isAdmin()) {
//     document.getElementById('addPartBtn').style.display = 'none';
// }

let allParts = [];

async function loadParts() {
    try {
        const data = await apiGet('/api/parts');
        allParts = data.parts || [];
        populateFilters();
        filterAndDisplayParts();
    } catch (error) {
        console.error('Failed to load parts:', error);
    }
}

function populateFilters() {
    const categories = [...new Set(allParts.map(p => p.category).filter(Boolean))];
    const locations = [...new Set(allParts.map(p => p.location).filter(Boolean))];

    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(c => `<option value="${c}">${c}</option>`).join('');

    const locationFilter = document.getElementById('locationFilter');
    locationFilter.innerHTML = '<option value="">All Locations</option>' +
        locations.map(l => `<option value="${l}">${l}</option>`).join('');
}

function filterAndDisplayParts() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const location = document.getElementById('locationFilter').value;
    const stockLevel = document.getElementById('stockFilter').value;

    let filtered = allParts.filter(part => {
        const matchesSearch = !search || part.name.toLowerCase().includes(search) ||
            (part.description && part.description.toLowerCase().includes(search));
        const matchesCategory = !category || part.category === category;
        const matchesLocation = !location || part.location === location;
        const matchesStock = !stockLevel || (stockLevel === 'low' && part.is_low_stock);

        return matchesSearch && matchesCategory && matchesLocation && matchesStock;
    });

    displayParts(filtered);
}

function displayParts(parts) {
    const tbody = document.getElementById('partsTableBody');

    if (parts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No parts found</td></tr>';
        return;
    }

    tbody.innerHTML = parts.map(part => {
        const statusClass = part.is_low_stock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
        const statusText = part.is_low_stock ? 'Low Stock' : 'In Stock';

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">${part.name}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${part.category || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${part.location || '-'}</td>
                <td class="px-4 py-3 text-sm font-semibold">${part.quantity}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${part.min_quantity}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">${statusText}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button data-action="qr" data-id="${part.id}" class="text-blue-600 hover:text-blue-800" title="QR Code">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                            </svg>
                        </button>
                        <button data-action="edit" data-id="${part.id}" class="text-green-600 hover:text-green-800" title="Edit">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button data-action="delete" data-id="${part.id}" data-name="${escapeHtml(part.name)}" class="text-red-600 hover:text-red-800" title="Delete">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Add event listeners for action buttons
    tbody.querySelectorAll('button[data-action]').forEach(button => {
        button.addEventListener('click', function () {
            const action = this.dataset.action;
            const id = parseInt(this.dataset.id);

            if (action === 'qr') {
                showQRCode(id);
            } else if (action === 'edit') {
                editPart(id);
            } else if (action === 'delete') {
                const name = this.dataset.name;
                deletePart(id, name);
            }
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAddModal() {
    // if (!isAdmin()) return;

    document.getElementById('modalTitle').textContent = 'Add Spare Part';
    document.getElementById('partForm').reset();
    document.getElementById('partId').value = '';
    document.getElementById('partModal').classList.remove('hidden');
}

async function editPart(id) {
    // if (!isAdmin()) return;

    const part = allParts.find(p => p.id === id);
    if (!part) return;

    document.getElementById('modalTitle').textContent = 'Edit Spare Part';
    document.getElementById('partId').value = part.id;
    document.getElementById('partName').value = part.name;
    document.getElementById('partDescription').value = part.description || '';
    document.getElementById('partCategory').value = part.category || '';
    document.getElementById('partLocation').value = part.location || '';
    document.getElementById('partQuantity').value = part.quantity;
    document.getElementById('partMinQuantity').value = part.min_quantity;

    document.getElementById('partModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('partModal').classList.add('hidden');
}

document.getElementById('partForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const partId = document.getElementById('partId').value;

    formData.append('name', document.getElementById('partName').value);
    formData.append('description', document.getElementById('partDescription').value);
    formData.append('category', document.getElementById('partCategory').value);
    formData.append('location', document.getElementById('partLocation').value);
    formData.append('quantity', document.getElementById('partQuantity').value);
    formData.append('min_quantity', document.getElementById('partMinQuantity').value);

    const imageFile = document.getElementById('partImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        if (partId) {
            await apiPutFormData(`/api/parts/${partId}`, formData);
        } else {
            await apiPostFormData('/api/parts', formData);
        }

        closeModal();
        loadParts();
    } catch (error) {
        alert('Failed to save part: ' + error.message);
    }
});

async function deletePart(id, name) {
    // if (!isAdmin()) return;

    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
        await apiDelete(`/api/parts/${id}`);
        loadParts();
    } catch (error) {
        alert('Failed to delete part: ' + error.message);
    }
}

async function showQRCode(id) {
    try {
        const data = await apiGet(`/api/parts/${id}/qrcode`);
        document.getElementById('qrCodeImage').src = data.qr_code;
        document.getElementById('qrPartName').textContent = data.part_name;
        document.getElementById('qrModal').classList.remove('hidden');
    } catch (error) {
        alert('Failed to load QR code');
    }
}

function closeQRModal() {
    document.getElementById('qrModal').classList.add('hidden');
}

function printQR() {
    window.print();
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', filterAndDisplayParts);
document.getElementById('categoryFilter').addEventListener('change', filterAndDisplayParts);
document.getElementById('locationFilter').addEventListener('change', filterAndDisplayParts);
document.getElementById('stockFilter').addEventListener('change', filterAndDisplayParts);

// Load parts on page load
loadParts();
