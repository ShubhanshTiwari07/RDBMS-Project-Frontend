/**
 * Customers Page Logic - Full CRUD and Accounts/Loans profile view
 */

let allCustomers = [];

document.addEventListener('DOMContentLoaded', () => {
    loadCustomers();
});

async function loadCustomers() {
    const tableBody = document.getElementById('customersTableBody');
    tableBody.innerHTML = `<tr><td colspan="8" class="loading-text">Loading customer database...</td></tr>`;

    try {
        const result = await API.getCustomers();
        if (result.success && Array.isArray(result.data)) {
            allCustomers = result.data;
            renderCustomers(allCustomers);
        } else {
            tableBody.innerHTML = `<tr><td colspan="8" class="loading-text" style="color: var(--accent-red);">Failed to load customers: ${result.message || 'Unknown error'}</td></tr>`;
        }
    } catch (err) {
        console.error('Failed to load customers', err);
        tableBody.innerHTML = `<tr><td colspan="8" class="loading-text" style="color: var(--accent-red);">Error loading customers.</td></tr>`;
    }
}

function renderCustomers(customers) {
    const tableBody = document.getElementById('customersTableBody');
    if (!customers || customers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-text">
                    <div class="empty-state">
                        <div class="empty-icon">👤</div>
                        <div class="empty-title">No Customers Found</div>
                        <div class="empty-desc">Click "+ Add Customer" above to register a new account holder.</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = customers.map(c => `
        <tr>
            <td><span class="code-badge">#${c.Customer_ID}</span></td>
            <td>
                <div style="font-weight: 600; color: var(--text-primary);">${c.Name}</div>
            </td>
            <td>${c.Phone || '—'}</td>
            <td>${c.Email || '—'}</td>
            <td>
                <span class="badge ${c.Gender === 'Female' ? 'badge-purple' : (c.Gender === 'Male' ? 'badge-blue' : 'badge-gray')}">
                    ${c.Gender || 'Other'}
                </span>
            </td>
            <td style="color: var(--text-muted); font-size: 13px;">${formatDate(c.DOB)}</td>
            <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${c.Address || ''}">
                ${c.Address || '—'}
            </td>
            <td class="actions-cell">
                <div class="actions-group">
                    <button class="btn btn-secondary btn-sm" onclick="viewCustomerProfile(${c.Customer_ID})" title="View Profile">👁️ Details</button>
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal(${c.Customer_ID})" title="Edit Customer">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCustomerConfirm(${c.Customer_ID})" title="Delete Customer">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function handleSearch() {
    const searchVal = document.getElementById('customerSearchInput').value.toLowerCase().trim();
    const genderVal = document.getElementById('genderFilter').value;

    const filtered = allCustomers.filter(c => {
        const matchesSearch = !searchVal || 
            (c.Name && c.Name.toLowerCase().includes(searchVal)) ||
            (c.Email && c.Email.toLowerCase().includes(searchVal)) ||
            (c.Phone && c.Phone.toLowerCase().includes(searchVal)) ||
            (String(c.Customer_ID).includes(searchVal));

        const matchesGender = !genderVal || c.Gender === genderVal;
        return matchesSearch && matchesGender;
    });

    renderCustomers(filtered);
}

// Modal Management
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Customer';
    document.getElementById('customerForm').reset();
    document.getElementById('customerId').value = '';
    const modal = document.getElementById('customerModal');
    modal.classList.add('active');
}

function openEditModal(id) {
    const customer = allCustomers.find(c => c.Customer_ID == id);
    if (!customer) return;

    document.getElementById('modalTitle').textContent = 'Edit Customer #' + id;
    document.getElementById('customerId').value = customer.Customer_ID;
    document.getElementById('customerName').value = customer.Name || '';
    document.getElementById('customerDOB').value = formatDate(customer.DOB);
    document.getElementById('customerGender').value = customer.Gender || 'Male';
    document.getElementById('customerPhone').value = customer.Phone || '';
    document.getElementById('customerEmail').value = customer.Email || '';
    document.getElementById('customerAddress').value = customer.Address || '';

    const modal = document.getElementById('customerModal');
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('customerModal');
    modal.classList.remove('active');
}

async function handleCustomerSubmit(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('saveCustomerBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const id = document.getElementById('customerId').value;
    const payload = {
        Name: document.getElementById('customerName').value.trim(),
        DOB: document.getElementById('customerDOB').value || null,
        Gender: document.getElementById('customerGender').value,
        Phone: document.getElementById('customerPhone').value.trim() || null,
        Email: document.getElementById('customerEmail').value.trim() || null,
        Address: document.getElementById('customerAddress').value.trim() || null
    };

    try {
        let res;
        if (id) {
            res = await API.updateCustomer(id, payload);
        } else {
            res = await API.createCustomer(payload);
        }

        if (res.success) {
            showToast(id ? 'Customer updated successfully!' : 'New customer registered!', 'success');
            closeModal();
            await loadCustomers();
        } else {
            showToast(res.message || 'Operation failed', 'error');
        }
    } catch (err) {
        showToast('Network error saving customer', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Customer';
    }
}

async function deleteCustomerConfirm(id) {
    const customer = allCustomers.find(c => c.Customer_ID == id);
    const name = customer ? customer.Name : `Customer #${id}`;

    if (!confirm(`Are you sure you want to delete "${name}"? This will also remove associated bank accounts.`)) {
        return;
    }

    try {
        const res = await API.deleteCustomer(id);
        if (res.success) {
            showToast(`Customer #${id} deleted successfully`, 'success');
            await loadCustomers();
        } else {
            showToast(res.message || 'Failed to delete customer', 'error');
        }
    } catch (err) {
        showToast('Error deleting customer', 'error');
    }
}

// Profile Modal
async function viewCustomerProfile(id) {
    const customer = allCustomers.find(c => c.Customer_ID == id);
    if (!customer) return;

    document.getElementById('profileName').textContent = customer.Name + ' — Account Profile';
    const profileDiv = document.getElementById('profileDetails');
    profileDiv.innerHTML = `<div class="loading-text">Loading accounts & loan records...</div>`;
    
    document.getElementById('customerProfileModal').classList.add('active');

    try {
        const [accRes, loanRes] = await Promise.all([
            API.getCustomerAccounts(id),
            API.getCustomerLoans(id)
        ]);

        const accounts = accRes.data || [];
        const loans = loanRes.data || [];

        let accountsHtml = accounts.length > 0 ? accounts.map(a => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-secondary); border-radius:var(--radius-sm); margin-bottom:8px; border:1px solid var(--border-light);">
                <div>
                    <span class="code-badge">${a.Account_Number}</span>
                    <span class="badge ${a.Account_Type === 'Savings' ? 'badge-blue' : 'badge-purple'}" style="margin-left:6px;">${a.Account_Type}</span>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Branch: ${a.Branch_Name || 'Main Branch'}</div>
                </div>
                <div style="text-align:right;">
                    <div class="amount-positive">${formatCurrency(a.Balance)}</div>
                    <span class="badge ${a.Status === 'Active' ? 'badge-green' : 'badge-red'}">${a.Status}</span>
                </div>
            </div>
        `).join('') : `<div class="empty-desc" style="padding:12px; text-align:center;">No accounts registered for this customer.</div>`;

        let loansHtml = loans.length > 0 ? loans.map(l => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-secondary); border-radius:var(--radius-sm); margin-bottom:8px; border:1px solid var(--border-light);">
                <div>
                    <strong>${l.Loan_Type}</strong>
                    <div style="font-size:12px; color:var(--text-muted);">Interest Rate: ${l.Interest_Rate}%</div>
                </div>
                <div style="text-align:right;">
                    <div class="amount-neutral">${formatCurrency(l.Principal_Amount)}</div>
                    <span class="badge ${l.Status === 'Active' ? 'badge-green' : 'badge-gray'}">${l.Status}</span>
                </div>
            </div>
        `).join('') : `<div class="empty-desc" style="padding:12px; text-align:center;">No active loans for this customer.</div>`;

        profileDiv.innerHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Customer ID</div>
                    <div class="detail-value">#${customer.Customer_ID}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Gender & Age</div>
                    <div class="detail-value">${customer.Gender || '—'} (${formatDate(customer.DOB)})</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${customer.Phone || '—'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${customer.Email || '—'}</div>
                </div>
            </div>
            
            <div class="detail-item" style="margin-bottom:20px;">
                <div class="detail-label">Residential Address</div>
                <div class="detail-value">${customer.Address || 'No address registered.'}</div>
            </div>

            <div style="margin-top:20px;">
                <h4 style="font-size:14px; color:var(--text-secondary); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">Linked Accounts (${accounts.length})</h4>
                ${accountsHtml}
            </div>

            <div style="margin-top:20px;">
                <h4 style="font-size:14px; color:var(--text-secondary); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">Loan Records (${loans.length})</h4>
                ${loansHtml}
            </div>
        `;
    } catch (e) {
        profileDiv.innerHTML = `<div class="loading-text" style="color:var(--accent-red);">Failed to load profile details.</div>`;
    }
}

function closeProfileModal() {
    document.getElementById('customerProfileModal').classList.remove('active');
}
