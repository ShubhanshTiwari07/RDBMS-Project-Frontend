/**
 * Transfers Page Logic - Fund transfers with real-time balance checks
 */

let allTransfers = [];
let availableAccounts = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadAccountsDropdown();
    await loadTransfers();
});

async function loadAccountsDropdown() {
    try {
        const res = await API.getAccounts();
        if (res.success && Array.isArray(res.data)) {
            availableAccounts = res.data.filter(a => a.Status === 'Active');
            
            const fromSelect = document.getElementById('fromAccountSelect');
            const toSelect = document.getElementById('toAccountSelect');

            const optionsHtml = availableAccounts.map(a => 
                `<option value="${a.Account_ID}">${a.Account_Number} — ${a.Customer_Name} (Bal: ${formatCurrency(a.Balance)})</option>`
            ).join('');

            fromSelect.innerHTML = '<option value="">-- Choose Debiting Account --</option>' + optionsHtml;
            toSelect.innerHTML = '<option value="">-- Choose Crediting Account --</option>' + optionsHtml;
        }
    } catch (e) {
        console.error('Failed to load accounts for transfer', e);
    }
}

function handleSenderAccountChange() {
    const fromId = document.getElementById('fromAccountSelect').value;
    const hint = document.getElementById('senderBalanceHint');
    
    if (!fromId) {
        hint.textContent = 'Available: ₹0.00';
        hint.style.color = 'var(--text-muted)';
        return;
    }

    const account = availableAccounts.find(a => a.Account_ID == fromId);
    if (account) {
        hint.textContent = `Available Liquid Balance: ${formatCurrency(account.Balance)}`;
        hint.style.color = 'var(--accent-green)';
    }
}

async function loadTransfers() {
    const tableBody = document.getElementById('transfersTableBody');
    tableBody.innerHTML = `<tr><td colspan="6" class="loading-text">Loading wire transfer logs...</td></tr>`;

    try {
        const result = await API.getTransfers();
        if (result.success && Array.isArray(result.data)) {
            allTransfers = result.data;
            renderTransfers(allTransfers);
        } else {
            tableBody.innerHTML = `<tr><td colspan="6" class="loading-text" style="color: var(--accent-red);">Failed to load transfers: ${result.message || 'Error'}</td></tr>`;
        }
    } catch (e) {
        console.error('Failed to load transfers', e);
        tableBody.innerHTML = `<tr><td colspan="6" class="loading-text" style="color: var(--accent-red);">Error loading transfers.</td></tr>`;
    }
}

function renderTransfers(transfers) {
    const tableBody = document.getElementById('transfersTableBody');
    if (!transfers || transfers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-text">
                    <div class="empty-state">
                        <div class="empty-icon">💸</div>
                        <div class="empty-title">No Transfers Initiated</div>
                        <div class="empty-desc">Use the form above to process the first inter-account transfer.</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = transfers.map(t => {
        let statusBadge = 'badge-green';
        if (t.Status === 'Pending') statusBadge = 'badge-amber';
        if (t.Status === 'Failed') statusBadge = 'badge-red';

        return `
            <tr>
                <td><span class="code-badge">${t.Reference_Number || ('TRF-' + t.Transfer_ID)}</span></td>
                <td>
                    <span class="code-badge">${t.From_Account || ('ACC' + t.From_Account_ID)}</span>
                </td>
                <td>
                    <span class="code-badge">${t.To_Account || ('ACC' + t.To_Account_ID)}</span>
                </td>
                <td class="amount-neutral">${formatCurrency(t.Amount)}</td>
                <td><span class="badge ${statusBadge}">${t.Status || 'Completed'}</span></td>
                <td style="color: var(--text-muted); font-size: 13px;">${formatDateTime(t.Transfer_Date)}</td>
            </tr>
        `;
    }).join('');
}

function filterTransfers() {
    const searchVal = document.getElementById('transferSearchInput').value.toLowerCase().trim();
    const statusVal = document.getElementById('transferStatusFilter').value;

    const filtered = allTransfers.filter(t => {
        const matchesSearch = !searchVal ||
            (t.Reference_Number && t.Reference_Number.toLowerCase().includes(searchVal)) ||
            (t.From_Account && t.From_Account.toLowerCase().includes(searchVal)) ||
            (t.To_Account && t.To_Account.toLowerCase().includes(searchVal));

        const matchesStatus = !statusVal || t.Status === statusVal;
        return matchesSearch && matchesStatus;
    });

    renderTransfers(filtered);
}

async function handleTransferSubmit(e) {
    e.preventDefault();
    const fromId = parseInt(document.getElementById('fromAccountSelect').value);
    const toId = parseInt(document.getElementById('toAccountSelect').value);
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const description = document.getElementById('transferDescription').value.trim();

    if (fromId === toId) {
        showToast('Source and destination accounts cannot be identical.', 'error');
        return;
    }

    const sender = availableAccounts.find(a => a.Account_ID === fromId);
    if (!sender) {
        showToast('Sender account not found', 'error');
        return;
    }

    if (amount <= 0 || isNaN(amount)) {
        showToast('Transfer amount must be greater than zero', 'error');
        return;
    }

    if (sender.Balance < amount) {
        showToast(`Insufficient funds! Available balance is ${formatCurrency(sender.Balance)}`, 'error');
        return;
    }

    const btn = document.getElementById('initiateBtn');
    btn.disabled = true;
    btn.textContent = 'Processing Transfer...';

    const payload = {
        From_Account_ID: fromId,
        To_Account_ID: toId,
        Amount: amount,
        Description: description || `Transfer to ACC#${toId}`
    };

    try {
        const res = await API.initiateTransfer(payload);
        if (res.success) {
            showToast(`Transfer successful! Reference: ${res.reference || 'Done'}`, 'success');
            document.getElementById('transferForm').reset();
            document.getElementById('senderBalanceHint').textContent = 'Available: ₹0.00';
            
            // Reload accounts dropdown and transfer table
            await loadAccountsDropdown();
            await loadTransfers();
        } else {
            showToast(res.message || 'Transfer failed', 'error');
        }
    } catch (err) {
        showToast('Network error processing transfer', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirm & Transfer Funds';
    }
}
