/**
 * Dashboard Logic - Real-time metrics and operational overview
 */

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
});

async function loadDashboardData() {
    const tableBody = document.getElementById('recentTransactionsTableBody');
    const branchList = document.getElementById('branchSummaryList');

    try {
        const stats = await API.getDashboardStats();

        // Update Stat Cards
        document.getElementById('statCustomers').textContent = stats.totalCustomers;
        document.getElementById('statAccounts').textContent = stats.totalAccounts;
        document.getElementById('statTotalBalance').textContent = formatCurrency(stats.totalBalance);
        document.getElementById('statLoanVolume').textContent = formatCurrency(stats.totalLoanVolume);
        document.getElementById('statLoanCount').textContent = stats.totalLoans;

        // Render Recent Transactions
        if (stats.recentTransactions && stats.recentTransactions.length > 0) {
            tableBody.innerHTML = stats.recentTransactions.map(tx => {
                const isCredit = tx.Transaction_Type === 'Credit';
                const badgeClass = isCredit ? 'badge-green' : 'badge-red';
                const amountClass = isCredit ? 'amount-positive' : 'amount-negative';
                const prefix = isCredit ? '+' : '-';

                return `
                    <tr>
                        <td><span class="code-badge">${tx.Account_Number || ('ACC' + tx.Account_ID)}</span></td>
                        <td><span class="badge ${badgeClass}">${tx.Transaction_Type}</span></td>
                        <td class="${amountClass}">${prefix}${formatCurrency(tx.Amount)}</td>
                        <td class="amount-neutral">${formatCurrency(tx.Balance_After)}</td>
                        <td>${tx.Description || '—'}</td>
                        <td style="color: var(--text-muted); font-size: 12px;">${formatDateTime(tx.Transaction_Date)}</td>
                    </tr>
                `;
            }).join('');
        } else {
            tableBody.innerHTML = `<tr><td colspan="6" class="loading-text">No transactions recorded yet.</td></tr>`;
        }

        // Render Branch Summary
        const branchesRes = await API.getBranches();
        const branches = branchesRes.data || [];
        if (branches.length > 0) {
            branchList.innerHTML = branches.map(b => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
                    <div>
                        <div style="font-weight: 600; font-size: 13.5px; color: var(--text-primary);">${b.Branch_Name}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${b.City} • <span class="code-badge" style="font-size: 11px;">${b.IFSC_Code}</span></div>
                    </div>
                    <span class="badge badge-blue">${b.Employee_Count || 0} Staff</span>
                </div>
            `).join('');
        } else {
            branchList.innerHTML = `<div class="empty-desc" style="text-align: center; padding: 12px;">No branches found.</div>`;
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="loading-text" style="color: var(--accent-red);">Failed to load dashboard data.</td></tr>`;
    }
}
