/**
 * Branches Page Logic - Retail branch locations, IFSC codes & personnel assignments
 */

let allBranches = [];

document.addEventListener('DOMContentLoaded', () => {
    loadBranches();
});

async function loadBranches() {
    const tableBody = document.getElementById('branchesTableBody');
    tableBody.innerHTML = `<tr><td colspan="7" class="loading-text">Loading branch infrastructure...</td></tr>`;

    try {
        const result = await API.getBranches();
        if (result.success && Array.isArray(result.data)) {
            allBranches = result.data;
            updateStats(allBranches);
            renderBranches(allBranches);
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="loading-text" style="color: var(--accent-red);">Failed to load branches: ${result.message || 'Error'}</td></tr>`;
        }
    } catch (err) {
        console.error('Failed to load branches', err);
        tableBody.innerHTML = `<tr><td colspan="7" class="loading-text" style="color: var(--accent-red);">Error loading branches.</td></tr>`;
    }
}

function updateStats(branches) {
    const branchCount = branches.length;
    const cities = new Set(branches.map(b => b.City).filter(Boolean));
    const totalStaff = branches.reduce((acc, curr) => acc + (parseInt(curr.Employee_Count) || 0), 0);

    document.getElementById('statBranchCount').textContent = branchCount;
    document.getElementById('statCityCount').textContent = cities.size;
    document.getElementById('statStaffAssigned').textContent = totalStaff;
}

function renderBranches(branches) {
    const tableBody = document.getElementById('branchesTableBody');
    if (!branches || branches.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-text">
                    <div class="empty-state">
                        <div class="empty-icon">🏢</div>
                        <div class="empty-title">No Branches Found</div>
                        <div class="empty-desc">Click "+ Establish New Branch" above to add an operating location.</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = branches.map(b => `
        <tr>
            <td><span class="code-badge">#${b.Branch_ID}</span></td>
            <td>
                <div style="font-weight: 600; color: var(--text-primary);">${b.Branch_Name}</div>
            </td>
            <td><span class="code-badge" style="color: var(--accent-blue);">${b.IFSC_Code}</span></td>
            <td><span class="badge badge-purple">${b.City || '—'}</span></td>
            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${b.Address || ''}">
                ${b.Address || '—'}
            </td>
            <td>
                <span class="badge badge-blue">${b.Employee_Count || 0} Staff</span>
            </td>
            <td class="actions-cell">
                <div class="actions-group">
                    <button class="btn btn-secondary btn-sm" onclick="viewBranchDetails(${b.Branch_ID})" title="View Details">👁️ Staff & Accounts</button>
                    <button class="btn btn-secondary btn-sm" onclick="openEditBranchModal(${b.Branch_ID})" title="Edit Branch">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBranchConfirm(${b.Branch_ID})" title="Remove Branch">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterBranches() {
    const searchVal = document.getElementById('branchSearchInput').value.toLowerCase().trim();

    const filtered = allBranches.filter(b => {
        return !searchVal ||
            (b.Branch_Name && b.Branch_Name.toLowerCase().includes(searchVal)) ||
            (b.IFSC_Code && b.IFSC_Code.toLowerCase().includes(searchVal)) ||
            (b.City && b.City.toLowerCase().includes(searchVal)) ||
            (String(b.Branch_ID).includes(searchVal));
    });

    renderBranches(filtered);
}

function openAddBranchModal() {
    document.getElementById('branchModalTitle').textContent = 'Establish New Branch';
    document.getElementById('branchForm').reset();
    document.getElementById('branchId').value = '';
    document.getElementById('branchModal').classList.add('active');
}

function openEditBranchModal(id) {
    const branch = allBranches.find(b => b.Branch_ID == id);
    if (!branch) return;

    document.getElementById('branchModalTitle').textContent = `Edit Branch #${id} — ${branch.Branch_Name}`;
    document.getElementById('branchId').value = branch.Branch_ID;
    document.getElementById('branchName').value = branch.Branch_Name || '';
    document.getElementById('branchIFSC').value = branch.IFSC_Code || '';
    document.getElementById('branchCity').value = branch.City || '';
    document.getElementById('branchAddress').value = branch.Address || '';

    document.getElementById('branchModal').classList.add('active');
}

function closeBranchModal() {
    document.getElementById('branchModal').classList.remove('active');
}

async function handleBranchSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBranchBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const id = document.getElementById('branchId').value;
    const payload = {
        Branch_Name: document.getElementById('branchName').value.trim(),
        IFSC_Code: document.getElementById('branchIFSC').value.trim().toUpperCase(),
        City: document.getElementById('branchCity').value.trim(),
        Address: document.getElementById('branchAddress').value.trim() || null
    };

    try {
        let res;
        if (id) {
            res = await API.updateBranch(id, payload);
        } else {
            res = await API.createBranch(payload);
        }

        if (res.success) {
            showToast(id ? 'Branch details updated!' : 'New branch established!', 'success');
            closeBranchModal();
            await loadBranches();
        } else {
            showToast(res.message || 'Operation failed', 'error');
        }
    } catch (err) {
        showToast('Network error saving branch', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Branch';
    }
}

async function deleteBranchConfirm(id) {
    const branch = allBranches.find(b => b.Branch_ID == id);
    const name = branch ? branch.Branch_Name : `Branch #${id}`;

    if (!confirm(`Are you sure you want to close and remove "${name}"? Accounts registered to this branch will need reassignment.`)) {
        return;
    }

    try {
        const res = await API.deleteBranch(id);
        if (res.success) {
            showToast(`Branch #${id} removed successfully`, 'success');
            await loadBranches();
        } else {
            showToast(res.message || 'Failed to remove branch', 'error');
        }
    } catch (err) {
        showToast('Error removing branch', 'error');
    }
}

async function viewBranchDetails(id) {
    const branch = allBranches.find(b => b.Branch_ID == id);
    if (!branch) return;

    document.getElementById('branchDetailsTitle').textContent = `${branch.Branch_Name} — Network Office`;
    const content = document.getElementById('branchDetailsContent');
    content.innerHTML = `<div class="loading-text">Loading branch personnel & linked accounts...</div>`;

    document.getElementById('branchDetailsModal').classList.add('active');

    try {
        const [empRes, accRes] = await Promise.all([
            API.apiRequest(`/branches/${id}/employees`, { method: 'GET' }, () => {
                const db = getMockStorage();
                return { success: true, data: db.employees.filter(e => e.Branch_ID == id) };
            }),
            API.apiRequest(`/branches/${id}/accounts`, { method: 'GET' }, () => {
                const db = getMockStorage();
                return { success: true, data: db.accounts.filter(a => a.Branch_ID == id) };
            })
        ]);

        const employees = empRes.data || [];
        const accounts = accRes.data || [];

        let empListHtml = employees.length > 0 ? employees.map(e => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-bottom: 8px; border: 1px solid var(--border-light);">
                <div>
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 13.5px;">${e.Name}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${e.Role} • ${e.Email || 'No email'}</div>
                </div>
                <span class="badge badge-blue">${e.Role}</span>
            </div>
        `).join('') : `<div class="empty-desc" style="padding: 12px; text-align: center;">No staff currently assigned to this branch.</div>`;

        let accListHtml = accounts.length > 0 ? accounts.map(a => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-bottom: 8px; border: 1px solid var(--border-light);">
                <div>
                    <span class="code-badge">${a.Account_Number}</span>
                    <span style="margin-left: 8px; font-weight: 500; font-size: 13.5px;">${a.Customer_Name || 'Client'}</span>
                </div>
                <div class="amount-positive">${formatCurrency(a.Balance)}</div>
            </div>
        `).join('') : `<div class="empty-desc" style="padding: 12px; text-align: center;">No accounts registered at this branch.</div>`;

        content.innerHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">IFSC Code</div>
                    <div class="detail-value" style="color: var(--accent-blue);">${branch.IFSC_Code}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">City</div>
                    <div class="detail-value">${branch.City}</div>
                </div>
            </div>

            <div class="detail-item" style="margin-bottom: 18px;">
                <div class="detail-label">Office Address</div>
                <div class="detail-value">${branch.Address || 'No street address specified.'}</div>
            </div>

            <div style="margin-top: 20px;">
                <h4 style="font-size:14px; color:var(--text-secondary); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">Assigned Staff (${employees.length})</h4>
                ${empListHtml}
            </div>

            <div style="margin-top: 20px;">
                <h4 style="font-size:14px; color:var(--text-secondary); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">Registered Accounts (${accounts.length})</h4>
                ${accListHtml}
            </div>
        `;
    } catch (e) {
        content.innerHTML = `<div class="loading-text" style="color: var(--accent-red);">Failed to load branch records.</div>`;
    }
}

function closeBranchDetailsModal() {
    document.getElementById('branchDetailsModal').classList.remove('active');
}
