/**
 * Loans Page Logic - Credit facilities, EMI repayments & loan summaries
 */

let allLoans = [];
let allCustomersList = [];

document.addEventListener('DOMContentLoaded', async () => {
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('loanStartDate');
    if (startDateInput) startDateInput.value = today;
    const paymentDateInput = document.getElementById('paymentDate');
    if (paymentDateInput) paymentDateInput.value = today;

    await loadCustomersDropdown();
    await loadLoans();
});

async function loadCustomersDropdown() {
    try {
        const res = await API.getCustomers();
        if (res.success && Array.isArray(res.data)) {
            allCustomersList = res.data;
            const select = document.getElementById('loanCustomerSelect');
            select.innerHTML = '<option value="">-- Choose Borrower --</option>' +
                allCustomersList.map(c => `<option value="${c.Customer_ID}">${c.Name} (ID: ${c.Customer_ID})</option>`).join('');
        }
    } catch (e) {
        console.error('Failed to load customers for loan select', e);
    }
}

async function loadLoans() {
    const tableBody = document.getElementById('loansTableBody');
    tableBody.innerHTML = `<tr><td colspan="10" class="loading-text">Loading credit facilities...</td></tr>`;

    try {
        const result = await API.getLoans();
        if (result.success && Array.isArray(result.data)) {
            allLoans = result.data;
            updateStats(allLoans);
            renderLoans(allLoans);
        } else {
            tableBody.innerHTML = `<tr><td colspan="10" class="loading-text" style="color: var(--accent-red);">Failed to load loans: ${result.message || 'Error'}</td></tr>`;
        }
    } catch (err) {
        console.error('Failed to load loans', err);
        tableBody.innerHTML = `<tr><td colspan="10" class="loading-text" style="color: var(--accent-red);">Error loading loans.</td></tr>`;
    }
}

function updateStats(loans) {
    let principalTotal = 0;
    let recoveredTotal = 0;
    let activeCount = 0;

    loans.forEach(l => {
        const principal = parseFloat(l.Principal_Amount) || 0;
        const paid = parseFloat(l.Total_Paid) || 0;
        principalTotal += principal;
        recoveredTotal += paid;
        if (l.Status === 'Active') activeCount++;
    });

    document.getElementById('statPrincipalDisbursed').textContent = formatCurrency(principalTotal);
    document.getElementById('statTotalRecovered').textContent = formatCurrency(recoveredTotal);
    document.getElementById('statActiveLoansCount').textContent = activeCount;
}

function renderLoans(loans) {
    const tableBody = document.getElementById('loansTableBody');
    if (!loans || loans.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="loading-text">
                    <div class="empty-state">
                        <div class="empty-icon">🏛️</div>
                        <div class="empty-title">No Loans Found</div>
                        <div class="empty-desc">Click "+ Issue New Loan" to disburse credit to a registered customer.</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = loans.map(l => {
        const principal = parseFloat(l.Principal_Amount) || 0;
        const paid = parseFloat(l.Total_Paid) || 0;
        const remaining = l.Remaining_Balance !== undefined ? parseFloat(l.Remaining_Balance) : Math.max(0, principal - paid);

        let statusBadge = 'badge-green';
        if (l.Status === 'Closed') statusBadge = 'badge-gray';
        if (l.Status === 'Defaulted') statusBadge = 'badge-red';

        const canPay = l.Status === 'Active';

        return `
            <tr>
                <td><span class="code-badge">#${l.Loan_ID}</span></td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${l.Customer_Name || ('Customer #' + l.Customer_ID)}</div>
                </td>
                <td>
                    <span class="badge badge-purple">${l.Loan_Type}</span>
                </td>
                <td class="amount-neutral">${formatCurrency(principal)}</td>
                <td style="font-weight: 500;">${l.Interest_Rate}%</td>
                <td class="amount-positive">${formatCurrency(paid)}</td>
                <td class="${remaining > 0 ? 'amount-negative' : 'amount-neutral'}">${formatCurrency(remaining)}</td>
                <td><span class="badge ${statusBadge}">${l.Status || 'Active'}</span></td>
                <td style="color: var(--text-muted); font-size: 13px;">${formatDate(l.Start_Date)}</td>
                <td class="actions-cell">
                    <div class="actions-group">
                        ${canPay ? `<button class="btn btn-success btn-sm" onclick="openPaymentModal(${l.Loan_ID})" title="Record Payment">💵 Pay EMI</button>` : ''}
                        <button class="btn btn-secondary btn-sm" onclick="viewLoanHistory(${l.Loan_ID})" title="View Payments">📑 Payments</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteLoanConfirm(${l.Loan_ID})" title="Cancel Loan">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterLoans() {
    const searchVal = document.getElementById('loanSearchInput').value.toLowerCase().trim();
    const statusVal = document.getElementById('loanStatusFilter').value;

    const filtered = allLoans.filter(l => {
        const matchesSearch = !searchVal ||
            (l.Customer_Name && l.Customer_Name.toLowerCase().includes(searchVal)) ||
            (l.Loan_Type && l.Loan_Type.toLowerCase().includes(searchVal)) ||
            (String(l.Loan_ID).includes(searchVal));

        const matchesStatus = !statusVal || l.Status === statusVal;
        return matchesSearch && matchesStatus;
    });

    renderLoans(filtered);
}

function openAddLoanModal() {
    document.getElementById('addLoanForm').reset();
    document.getElementById('loanStartDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('loanInterestRate').value = '8.5';
    document.getElementById('addLoanModal').classList.add('active');
}

function closeAddLoanModal() {
    document.getElementById('addLoanModal').classList.remove('active');
}

async function handleCreateLoan(e) {
    e.preventDefault();
    const btn = document.getElementById('saveLoanBtn');
    btn.disabled = true;
    btn.textContent = 'Disbursing...';

    const payload = {
        Customer_ID: parseInt(document.getElementById('loanCustomerSelect').value),
        Loan_Type: document.getElementById('loanTypeSelect').value,
        Principal_Amount: parseFloat(document.getElementById('loanPrincipal').value),
        Interest_Rate: parseFloat(document.getElementById('loanInterestRate').value),
        Start_Date: document.getElementById('loanStartDate').value
    };

    try {
        const res = await API.createLoan(payload);
        if (res.success) {
            showToast('Loan disbursed successfully!', 'success');
            closeAddLoanModal();
            await loadLoans();
        } else {
            showToast(res.message || 'Failed to issue loan', 'error');
        }
    } catch (err) {
        showToast('Error issuing loan', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Disburse Loan';
    }
}

function openPaymentModal(loanId) {
    const loan = allLoans.find(l => l.Loan_ID == loanId);
    if (!loan) return;

    const principal = parseFloat(loan.Principal_Amount) || 0;
    const paid = parseFloat(loan.Total_Paid) || 0;
    const remaining = loan.Remaining_Balance !== undefined ? parseFloat(loan.Remaining_Balance) : Math.max(0, principal - paid);

    document.getElementById('paymentModalTitle').textContent = `Record Payment — Loan #${loanId} (${loan.Customer_Name})`;
    document.getElementById('paymentLoanId').value = loanId;
    document.getElementById('paymentRemainingBal').textContent = formatCurrency(remaining);
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentAmount').max = remaining;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];

    document.getElementById('loanPaymentModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('loanPaymentModal').classList.remove('active');
}

async function handleLoanPaymentSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('savePaymentBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const loanId = parseInt(document.getElementById('paymentLoanId').value);
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;

    const payload = {
        Loan_ID: loanId,
        Amount: amount,
        Payment_Date: date
    };

    try {
        const res = await API.createLoanPayment(payload);
        if (res.success) {
            showToast('Repayment submitted successfully!', 'success');
            closePaymentModal();
            await loadLoans();
        } else {
            showToast(res.message || 'Payment submission failed', 'error');
        }
    } catch (err) {
        showToast('Error recording payment', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Payment';
    }
}

async function viewLoanHistory(loanId) {
    const loan = allLoans.find(l => l.Loan_ID == loanId);
    if (!loan) return;

    document.getElementById('historyModalTitle').textContent = `Loan #${loanId} — Repayment Ledger`;
    const content = document.getElementById('loanHistoryContent');
    content.innerHTML = `<div class="loading-text">Loading loan payment receipts...</div>`;

    document.getElementById('loanHistoryModal').classList.add('active');

    try {
        const res = await API.getLoanPayments(loanId);
        const payments = res.data || [];

        const principal = parseFloat(loan.Principal_Amount) || 0;
        const paid = parseFloat(loan.Total_Paid) || 0;
        const remaining = loan.Remaining_Balance !== undefined ? parseFloat(loan.Remaining_Balance) : Math.max(0, principal - paid);

        let rowsHtml = payments.length > 0 ? payments.map(p => `
            <tr>
                <td><span class="code-badge">#${p.Payment_ID}</span></td>
                <td class="amount-positive">${formatCurrency(p.Amount)}</td>
                <td style="color: var(--text-muted); font-size: 13px;">${formatDate(p.Payment_Date)}</td>
                <td><span class="badge badge-green">Settled</span></td>
            </tr>
        `).join('') : `<tr><td colspan="4" class="loading-text">No payment records yet.</td></tr>`;

        content.innerHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Borrower</div>
                    <div class="detail-value">${loan.Customer_Name || '—'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Loan Facility</div>
                    <div class="detail-value">${loan.Loan_Type} (${loan.Interest_Rate}%)</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Principal Amount</div>
                    <div class="detail-value">${formatCurrency(principal)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Remaining Balance</div>
                    <div class="detail-value amount-positive">${formatCurrency(remaining)}</div>
                </div>
            </div>

            <div style="margin-top: 18px;">
                <h4 style="font-size:14px; color:var(--text-secondary); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">Payment Audit Logs</h4>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Receipt ID</th>
                                <th>Amount Paid</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (e) {
        content.innerHTML = `<div class="loading-text" style="color: var(--accent-red);">Failed to load payments history.</div>`;
    }
}

function closeHistoryModal() {
    document.getElementById('loanHistoryModal').classList.remove('active');
}

async function deleteLoanConfirm(loanId) {
    if (!confirm(`Are you sure you want to delete Loan record #${loanId}? This will remove all associated payment receipts.`)) {
        return;
    }

    try {
        const res = await API.deleteLoan(loanId);
        if (res.success) {
            showToast(`Loan #${loanId} deleted successfully`, 'success');
            await loadLoans();
        } else {
            showToast(res.message || 'Failed to delete loan', 'error');
        }
    } catch (err) {
        showToast('Error deleting loan', 'error');
    }
}
