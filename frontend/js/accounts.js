/**
 * Accounts Page Logic - Account creation, management, balance updates & ledger view
 */

let allAccounts = [];
let allCustomersList = [];
let allBranchesList = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Set default date to today
    const dateInput = document.getElementById('newAccountDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    await loadAccounts();
    await loadDropdowns();
});

async function loadAccounts() {
    const tableBody = document.getElementById('accountsTableBody');
    tableBody.innerHTML = `<tr><td colspan="8" class="loading-text">Loading account records...</td></tr>`;

    try {
        const result = await API.getAccounts();
        if (result.success && Array.isArray(result.data)) {
            allAccounts = result.data;
            updateStats(allAccounts);
            renderAccounts(allAccounts);
        } else {
            tableBody.innerHTML = `<tr><td colspan="8" class="loading-text" style="color: var(--accent-red);">Failed to load accounts: ${result.message || 'Error'}</td></tr>`;
        }
    } catch (err) {
        console.error('Failed to load accounts', err);
        tableBody.innerHTML = `<tr><td colspan="8" class="loading-text" style="color: var(--accent-red);">Error loading accounts.</td></tr>`;
    }
}

function updateStats(accounts) {
    const totalCount = accounts.length;
    let savingsTotal = 0;
    let currentTotal = 0;

    accounts.forEach(a => {
        const bal = parseFloat(a.Balance) || 0;
        if (a.Account_Type === 'Savings' || a.Account_Type === 'Savings_Account') {
            savingsTotal += bal;
        } else {
            currentTotal += bal;
        }
    });

    document.getElementById('totalAccountsCount').textContent = totalCount;
    document.getElementById('totalSavingsBalance').textContent = formatCurrency(savingsTotal);
    document.getElementById('totalCurrentBalance').textContent = formatCurrency(currentTotal);
}

function renderAccounts(accounts) {
    const tableBody = document.getElementById('accountsTableBody');
    if (!accounts || accounts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-text">
                    <div class="empty-state">
                        <div class="empty-icon">💳</div>
                        <div class="empty-title">No Accounts Found</div>
                        <div class="empty-desc">Open a new account for an existing customer using the button above.</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = accounts.map(a => {
        const isSavings = a.Account_Type === 'Savings' || a.Account_Type === 'Savings_Account';
        const typeBadge = isSavings ? 'badge-blue' : 'badge-purple';
        
        let statusBadge = 'badge-green';
        if (a.Status === 'Inactive') statusBadge = 'badge-amber';
        if (a.Status === 'Closed') statusBadge = 'badge-red';

        return `
            <tr>
                <td><span class="code-badge">${a.Account_Number}</span></td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${a.Customer_Name || ('Customer #' + a.Customer_ID)}</div>
                </td>
                <td>
                    <span class="badge ${typeBadge}">${isSavings ? 'Savings' : 'Current'}</span>
                </td>
                <td>${a.Branch_Name || 'Main Branch'}</td>
                <td class="amount-positive">${formatCurrency(a.Balance)}</td>
                <td style="color: var(--text-muted); font-size: 13px;">${formatDate(a.Opening_Date)}</td>
                <td>
                    <span class="badge ${statusBadge}">${a.Status || 'Active'}</span>
                </td>
                <td class="actions-cell">
                    <div class="actions-group">
                        <button class="btn btn-secondary btn-sm" onclick="viewAccountLedger(${a.Account_ID})" title="View Ledger">📑 Ledger</button>
                        <button class="btn btn-secondary btn-sm" onclick="openEditAccountModal(${a.Account_ID})" title="Edit Status/Balance">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteAccountConfirm(${a.Account_ID})" title="Close Account">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAccounts() {
    const searchVal = document.getElementById('accountSearchInput').value.toLowerCase().trim();
    const typeVal = document.getElementById('typeFilter').value;
    const statusVal = document.getElementById('statusFilter').value;

    const filtered = allAccounts.filter(a => {
        const matchesSearch = !searchVal || 
            (a.Account_Number && a.Account_Number.toLowerCase().includes(searchVal)) ||
            (a.Customer_Name && a.Customer_Name.toLowerCase().includes(searchVal)) ||
            (a.Branch_Name && a.Branch_Name.toLowerCase().includes(searchVal));

        const isSavings = a.Account_Type === 'Savings' || a.Account_Type === 'Savings_Account';
        const matchesType = !typeVal || (typeVal === 'Savings' ? isSavings : !isSavings);
        const matchesStatus = !statusVal || a.Status === statusVal;

        return matchesSearch && matchesType && matchesStatus;
    });

    renderAccounts(filtered);
}

async function loadDropdowns() {
    try {
        const [customersRes, branchesRes] = await Promise.all([
            API.getCustomers(),
            API.getBranches()
        ]);

        if (customersRes.success && Array.isArray(customersRes.data)) {
            allCustomersList = customersRes.data;
            const custSelect = document.getElementById('newAccountCustomer');
            custSelect.innerHTML = '<option value="">-- Choose Account Holder --</option>' + 
                allCustomersList.map(c => `<option value="${c.Customer_ID}">${c.Name} (ID: ${c.Customer_ID})</option>`).join('');
        }

        if (branchesRes.success && Array.isArray(branchesRes.data)) {
            allBranchesList = branchesRes.data;
            const branchSelect = document.getElementById('newAccountBranch');
            branchSelect.innerHTML = '<option value="">-- Choose Branch --</option>' + 
                allBranchesList.map(b => `<option value="${b.Branch_ID}">${b.Branch_Name} - ${b.City}</option>`).join('');
        }
    } catch (e) {
        console.error('Error loading dropdown lists', e);
    }
}

function toggleAccountTypeFields() {
    const type = document.getElementById('newAccountType').value;
    const savingsFields = document.getElementById('savingsFields');
    const currentFields = document.getElementById('currentFields');

    if (type === 'Savings') {
        savingsFields.style.display = 'grid';
        currentFields.style.display = 'none';
    } else {
        savingsFields.style.display = 'none';
        currentFields.style.display = 'flex';
    }
}

function openAddAccountModal() {
    document.getElementById('addAccountForm').reset();
    document.getElementById('newAccountDate').value = new Date().toISOString().split('T')[0];
    toggleAccountTypeFields();
    document.getElementById('addAccountModal').classList.add('active');
}

function closeAddAccountModal() {
    document.getElementById('addAccountModal').classList.remove('active');
}

async function handleCreateAccount(e) {
    e.preventDefault();
    const btn = document.getElementById('saveAccountBtn');
    btn.disabled = true;
    btn.textContent = 'Creating...';

    const accountType = document.getElementById('newAccountType').value;
    const payload = {
        Customer_ID: parseInt(document.getElementById('newAccountCustomer').value),
        Branch_ID: parseInt(document.getElementById('newAccountBranch').value),
        Account_Type: accountType,
        Balance: parseFloat(document.getElementById('newAccountBalance').value) || 0,
        Opening_Date: document.getElementById('newAccountDate').value,
        Status: document.getElementById('newAccountStatus').value,
        Interest_Rate: accountType === 'Savings' ? parseFloat(document.getElementById('newAccountInterestRate').value) : null,
        Minimum_Balance: accountType === 'Savings' ? parseFloat(document.getElementById('newAccountMinBalance').value) : null,
        Overdraft_Limit: accountType === 'Current' ? parseFloat(document.getElementById('newAccountOverdraft').value) : null
    };

    try {
        const res = await API.createAccount(payload);
        if (res.success) {
            showToast('Account opened successfully!', 'success');
            closeAddAccountModal();
            await loadAccounts();
        } else {
            showToast(res.message || 'Failed to create account', 'error');
        }
    } catch (err) {
        showToast('Error connecting to server', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

function openEditAccountModal(id) {
    const account = allAccounts.find(a => a.Account_ID == id);
    if (!account) return;

    document.getElementById('editModalTitle').textContent = `Edit Account ${account.Account_Number}`;
    document.getElementById('editAccountId').value = account.Account_ID;
    document.getElementById('editAccountBalance').value = account.Balance;
    document.getElementById('editAccountStatus').value = account.Status || 'Active';

    document.getElementById('editAccountModal').classList.add('active');
}

function closeEditAccountModal() {
    document.getElementById('editAccountModal').classList.remove('active');
}

async function handleUpdateAccount(e) {
    e.preventDefault();
    const btn = document.getElementById('updateAccountBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const id = document.getElementById('editAccountId').value;
    const payload = {
        Balance: parseFloat(document.getElementById('editAccountBalance').value),
        Status: document.getElementById('editAccountStatus').value
    };

    try {
        const res = await API.updateAccount(id, payload);
        if (res.success) {
            showToast('Account updated successfully', 'success');
            closeEditAccountModal();
            await loadAccounts();
        } else {
            showToast(res.message || 'Update failed', 'error');
        }
    } catch (err) {
        showToast('Error updating account', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
}

async function deleteAccountConfirm(id) {
    const acc = allAccounts.find(a => a.Account_ID == id);
    const accNum = acc ? acc.Account_Number : `#${id}`;

    if (!confirm(`Are you sure you want to permanently delete account ${accNum}? All ledger history will be removed.`)) {
        return;
    }

    try {
        const res = await API.deleteAccount(id);
        if (res.success) {
            showToast(`Account ${accNum} deleted`, 'success');
            await loadAccounts();
        } else {
            showToast(res.message || 'Failed to delete account', 'error');
        }
    } catch (err) {
        showToast('Error deleting account', 'error');
    }
}

// Ledger View
async function viewAccountLedger(id) {
    const account = allAccounts.find(a => a.Account_ID == id);
    if (!account) return;

    document.getElementById('ledgerTitle').textContent = `${account.Account_Number} — Ledger & Transactions`;
    const ledgerContent = document.getElementById('ledgerContent');
    ledgerContent.innerHTML = `<div class="loading-text">Fetching account statement and transfers...</div>`;
    
    document.getElementById('accountLedgerModal').classList.add('active');

    try {
        const [txRes, trfRes] = await Promise.all([
            API.apiRequest(`/accounts/${id}/transactions`, { method: 'GET' }, () => {
                const db = getMockStorage();
                return { success: true, data: db.transactions.filter(t => t.Account_ID == id) };
            }),
            API.apiRequest(`/accounts/${id}/transfers`, { method: 'GET' }, () => {
                const db = getMockStorage();
                return { success: true, data: db.transfers.filter(t => t.From_Account_ID == id || t.To_Account_ID == id) };
            })
        ]);

        const transactions = txRes.data || [];
        const transfers = trfRes.data || [];

        let txRows = transactions.length > 0 ? transactions.map(t => {
            const isCredit = t.Transaction_Type === 'Credit';
            return `
                <tr>
                    <td><span class="badge ${isCredit ? 'badge-green' : 'badge-red'}">${t.Transaction_Type}</span></td>
                    <td class="${isCredit ? 'amount-positive' : 'amount-negative'}">${isCredit ? '+' : '-'}${formatCurrency(t.Amount)}</td>
                    <td class="amount-neutral">${formatCurrency(t.Balance_After)}</td>
                    <td>${t.Description || '—'}</td>
                    <td style="color: var(--text-muted); font-size: 12px;">${formatDateTime(t.Transaction_Date)}</td>
                </tr>
            `;
        }).join('') : `<tr><td colspan="5" class="loading-text">No transaction records found.</td></tr>`;

        let trfRows = transfers.length > 0 ? transfers.map(tr => `
            <tr>
                <td><span class="code-badge">${tr.Reference_Number}</span></td>
                <td>${tr.From_Account || ('ACC' + tr.From_Account_ID)}</td>
                <td>${tr.To_Account || ('ACC' + tr.To_Account_ID)}</td>
                <td class="amount-neutral">${formatCurrency(tr.Amount)}</td>
                <td><span class="badge badge-green">${tr.Status}</span></td>
                <td style="color: var(--text-muted); font-size: 12px;">${formatDateTime(tr.Transfer_Date)}</td>
            </tr>
        `).join('') : `<tr><td colspan="6" class="loading-text">No fund transfers recorded.</td></tr>`;

        ledgerContent.innerHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Account Holder</div>
                    <div class="detail-value">${account.Customer_Name || '—'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Current Balance</div>
                    <div class="detail-value amount-positive">${formatCurrency(account.Balance)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Type & Branch</div>
                    <div class="detail-value">${account.Account_Type} • ${account.Branch_Name || 'Main'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">${account.Status}</div>
                </div>
            </div>

            <div style="margin-top:20px;">
                <h4 style="font-size:14px; color:var(--text-secondary); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">Transaction Ledger</h4>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Balance After</th>
                                <th>Description</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>${txRows}</tbody>
                    </table>
                </div>
            </div>

            <div style="margin-top:24px;">
                <h4 style="font-size:14px; color:var(--text-secondary); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">Linked Fund Transfers</h4>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Ref #</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>${trfRows}</tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (e) {
        ledgerContent.innerHTML = `<div class="loading-text" style="color: var(--accent-red);">Failed to load ledger history.</div>`;
    }
}

function closeLedgerModal() {
    document.getElementById('accountLedgerModal').classList.remove('active');
}
