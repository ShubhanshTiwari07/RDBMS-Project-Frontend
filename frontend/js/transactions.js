/**
 * Transactions Page Logic - Journal entries, credits, debits & ledger stats
 */

let allTransactions = [];
let availableAccounts = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadAccountsDropdown();
    await loadTransactions();
});

async function loadAccountsDropdown() {
    try {
        const res = await API.getAccounts();
        if (res.success && Array.isArray(res.data)) {
            availableAccounts = res.data.filter(a => a.Status === 'Active');
            const select = document.getElementById('txAccountSelect');
            select.innerHTML = '<option value="">-- Choose Account --</option>' + 
                availableAccounts.map(a => 
                    `<option value="${a.Account_ID}">${a.Account_Number} — ${a.Customer_Name} (Bal: ${formatCurrency(a.Balance)})</option>`
                ).join('');
        }
    } catch (e) {
        console.error('Failed to load accounts for transaction modal', e);
    }
}

function handleAccountSelectChange() {
    const accId = document.getElementById('txAccountSelect').value;
    const hint = document.getElementById('txAccountBalanceHint');
    if (!accId) {
        hint.textContent = 'Current Balance: ₹0.00';
        return;
    }
    const acc = availableAccounts.find(a => a.Account_ID == accId);
    if (acc) {
        hint.textContent = `Current Balance: ${formatCurrency(acc.Balance)}`;
    }
}

async function loadTransactions() {
    const tableBody = document.getElementById('transactionsTableBody');
    tableBody.innerHTML = `<tr><td colspan="7" class="loading-text">Loading journal records...</td></tr>`;

    try {
        const result = await API.getTransactions();
        if (result.success && Array.isArray(result.data)) {
            allTransactions = result.data;
            updateStats(allTransactions);
            renderTransactions(allTransactions);
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="loading-text" style="color: var(--accent-red);">Failed to load transactions: ${result.message || 'Error'}</td></tr>`;
        }
    } catch (err) {
        console.error('Failed to load transactions', err);
        tableBody.innerHTML = `<tr><td colspan="7" class="loading-text" style="color: var(--accent-red);">Error loading transactions.</td></tr>`;
    }
}

function updateStats(transactions) {
    let creditTotal = 0;
    let debitTotal = 0;

    transactions.forEach(t => {
        const amt = parseFloat(t.Amount) || 0;
        if (t.Transaction_Type === 'Credit') {
            creditTotal += amt;
        } else {
            debitTotal += amt;
        }
    });

    document.getElementById('statTotalCredits').textContent = formatCurrency(creditTotal);
    document.getElementById('statTotalDebits').textContent = formatCurrency(debitTotal);
    document.getElementById('statTxCount').textContent = transactions.length;
}

function renderTransactions(transactions) {
    const tableBody = document.getElementById('transactionsTableBody');
    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-text">
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <div class="empty-title">No Transactions Found</div>
                        <div class="empty-desc">Post a new credit or debit transaction using the button above.</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = transactions.map(t => {
        const isCredit = t.Transaction_Type === 'Credit';
        const badgeClass = isCredit ? 'badge-green' : 'badge-red';
        const amountClass = isCredit ? 'amount-positive' : 'amount-negative';
        const prefix = isCredit ? '+' : '-';

        return `
            <tr>
                <td><span class="code-badge">#${t.Transaction_ID}</span></td>
                <td><span class="code-badge">${t.Account_Number || ('ACC' + t.Account_ID)}</span></td>
                <td><span class="badge ${badgeClass}">${t.Transaction_Type}</span></td>
                <td class="${amountClass}">${prefix}${formatCurrency(t.Amount)}</td>
                <td class="amount-neutral">${formatCurrency(t.Balance_After)}</td>
                <td>${t.Description || '—'}</td>
                <td style="color: var(--text-muted); font-size: 13px;">${formatDateTime(t.Transaction_Date)}</td>
            </tr>
        `;
    }).join('');
}

function filterTransactions() {
    const searchVal = document.getElementById('txSearchInput').value.toLowerCase().trim();
    const typeVal = document.getElementById('txTypeFilter').value;

    const filtered = allTransactions.filter(t => {
        const matchesSearch = !searchVal ||
            (t.Account_Number && t.Account_Number.toLowerCase().includes(searchVal)) ||
            (t.Description && t.Description.toLowerCase().includes(searchVal)) ||
            (String(t.Transaction_ID).includes(searchVal));

        const matchesType = !typeVal || t.Transaction_Type === typeVal;
        return matchesSearch && matchesType;
    });

    renderTransactions(filtered);
}

function openRecordTransactionModal() {
    document.getElementById('recordTxForm').reset();
    document.getElementById('txAccountBalanceHint').textContent = 'Current Balance: ₹0.00';
    document.getElementById('recordTxModal').classList.add('active');
}

function closeRecordTransactionModal() {
    document.getElementById('recordTxModal').classList.remove('active');
}

async function handleRecordTransaction(e) {
    e.preventDefault();
    const accId = parseInt(document.getElementById('txAccountSelect').value);
    const type = document.getElementById('txType').value;
    const amount = parseFloat(document.getElementById('txAmount').value);
    const description = document.getElementById('txDescription').value.trim();

    if (!accId) {
        showToast('Please select an account', 'error');
        return;
    }

    const account = availableAccounts.find(a => a.Account_ID === accId);
    if (!account) {
        showToast('Selected account not found', 'error');
        return;
    }

    if (amount <= 0 || isNaN(amount)) {
        showToast('Amount must be positive', 'error');
        return;
    }

    if (type === 'Debit' && account.Balance < amount) {
        showToast(`Insufficient balance! Current balance is ${formatCurrency(account.Balance)}`, 'error');
        return;
    }

    const btn = document.getElementById('saveTxBtn');
    btn.disabled = true;
    btn.textContent = 'Posting...';

    const payload = {
        Account_ID: accId,
        Transaction_Type: type,
        Amount: amount,
        Description: description || `${type} transaction`
    };

    try {
        const res = await API.createTransaction(payload);
        if (res.success) {
            showToast('Transaction posted successfully!', 'success');
            closeRecordTransactionModal();
            await loadAccountsDropdown();
            await loadTransactions();
        } else {
            showToast(res.message || 'Transaction failed', 'error');
        }
    } catch (err) {
        showToast('Error connecting to server', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Post Transaction';
    }
}
