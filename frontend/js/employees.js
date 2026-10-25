/**
 * Employees Page Logic - Staff directory, role assignments & payroll
 */

let allEmployees = [];
let allBranches = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadBranchesDropdown();
    await loadEmployees();
});

async function loadBranchesDropdown() {
    try {
        const res = await API.getBranches();
        if (res.success && Array.isArray(res.data)) {
            allBranches = res.data;
            const branchSelect = document.getElementById('empBranch');
            const filterSelect = document.getElementById('empBranchFilter');

            const options = allBranches.map(b => `<option value="${b.Branch_ID}">${b.Branch_Name} (${b.City})</option>`).join('');
            branchSelect.innerHTML = '<option value="">-- Choose Branch --</option>' + options;
            filterSelect.innerHTML = '<option value="">All Branches</option>' + options;
        }
    } catch (e) {
        console.error('Failed to load branches dropdown', e);
    }
}

async function loadEmployees() {
    const tableBody = document.getElementById('employeesTableBody');
    tableBody.innerHTML = `<tr><td colspan="8" class="loading-text">Loading employee records...</td></tr>`;

    try {
        const result = await API.getEmployees();
        if (result.success && Array.isArray(result.data)) {
            allEmployees = result.data;
            updateStats(allEmployees);
            renderEmployees(allEmployees);
        } else {
            tableBody.innerHTML = `<tr><td colspan="8" class="loading-text" style="color: var(--accent-red);">Failed to load employees: ${result.message || 'Error'}</td></tr>`;
        }
    } catch (err) {
        console.error('Failed to load employees', err);
        tableBody.innerHTML = `<tr><td colspan="8" class="loading-text" style="color: var(--accent-red);">Error loading employees.</td></tr>`;
    }
}

function updateStats(employees) {
    const count = employees.length;
    let totalPayroll = 0;

    employees.forEach(e => {
        totalPayroll += (parseFloat(e.Salary) || 0);
    });

    const avg = count > 0 ? (totalPayroll / count) : 0;

    document.getElementById('statStaffCount').textContent = count;
    document.getElementById('statTotalPayroll').textContent = formatCurrency(totalPayroll);
    document.getElementById('statAvgSalary').textContent = formatCurrency(avg);
}

function renderEmployees(employees) {
    const tableBody = document.getElementById('employeesTableBody');
    if (!employees || employees.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-text">
                    <div class="empty-state">
                        <div class="empty-icon">👔</div>
                        <div class="empty-title">No Employees Found</div>
                        <div class="empty-desc">Click "+ Onboard Employee" above to add staff to a branch.</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = employees.map(emp => {
        let roleBadge = 'badge-blue';
        if (emp.Role === 'Branch Manager') roleBadge = 'badge-purple';
        if (emp.Role === 'Teller') roleBadge = 'badge-green';
        if (emp.Role === 'Loan Officer') roleBadge = 'badge-amber';

        return `
            <tr>
                <td><span class="code-badge">#${emp.Employee_ID}</span></td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${emp.Name}</div>
                </td>
                <td><span class="badge ${roleBadge}">${emp.Role}</span></td>
                <td>${emp.Branch_Name || ('Branch #' + emp.Branch_ID)}</td>
                <td>${emp.Email || '—'}</td>
                <td>${emp.Phone || '—'}</td>
                <td class="amount-positive">${formatCurrency(emp.Salary)}</td>
                <td class="actions-cell">
                    <div class="actions-group">
                        <button class="btn btn-secondary btn-sm" onclick="openEditEmployeeModal(${emp.Employee_ID})" title="Edit Details">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteEmployeeConfirm(${emp.Employee_ID})" title="Remove Staff">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterEmployees() {
    const searchVal = document.getElementById('empSearchInput').value.toLowerCase().trim();
    const branchVal = document.getElementById('empBranchFilter').value;

    const filtered = allEmployees.filter(emp => {
        const matchesSearch = !searchVal ||
            (emp.Name && emp.Name.toLowerCase().includes(searchVal)) ||
            (emp.Role && emp.Role.toLowerCase().includes(searchVal)) ||
            (emp.Email && emp.Email.toLowerCase().includes(searchVal)) ||
            (String(emp.Employee_ID).includes(searchVal));

        const matchesBranch = !branchVal || emp.Branch_ID == branchVal;
        return matchesSearch && matchesBranch;
    });

    renderEmployees(filtered);
}

function openAddEmployeeModal() {
    document.getElementById('empModalTitle').textContent = 'Onboard New Employee';
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeModal').classList.add('active');
}

function openEditEmployeeModal(id) {
    const emp = allEmployees.find(e => e.Employee_ID == id);
    if (!emp) return;

    document.getElementById('empModalTitle').textContent = `Edit Staff #${id} — ${emp.Name}`;
    document.getElementById('employeeId').value = emp.Employee_ID;
    document.getElementById('empName').value = emp.Name || '';
    document.getElementById('empRole').value = emp.Role || 'Teller';
    document.getElementById('empBranch').value = emp.Branch_ID || '';
    document.getElementById('empEmail').value = emp.Email || '';
    document.getElementById('empPhone').value = emp.Phone || '';
    document.getElementById('empSalary').value = emp.Salary || '';

    document.getElementById('employeeModal').classList.add('active');
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').classList.remove('active');
}

async function handleEmployeeSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('saveEmpBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const id = document.getElementById('employeeId').value;
    const payload = {
        Name: document.getElementById('empName').value.trim(),
        Role: document.getElementById('empRole').value,
        Branch_ID: parseInt(document.getElementById('empBranch').value),
        Email: document.getElementById('empEmail').value.trim() || null,
        Phone: document.getElementById('empPhone').value.trim() || null,
        Salary: parseFloat(document.getElementById('empSalary').value) || 0
    };

    try {
        let res;
        if (id) {
            res = await API.updateEmployee(id, payload);
        } else {
            res = await API.createEmployee(payload);
        }

        if (res.success) {
            showToast(id ? 'Employee record updated!' : 'Staff onboarded successfully!', 'success');
            closeEmployeeModal();
            await loadEmployees();
        } else {
            showToast(res.message || 'Operation failed', 'error');
        }
    } catch (err) {
        showToast('Network error saving employee', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Employee';
    }
}

async function deleteEmployeeConfirm(id) {
    const emp = allEmployees.find(e => e.Employee_ID == id);
    const name = emp ? emp.Name : `Staff #${id}`;

    if (!confirm(`Are you sure you want to offboard "${name}"?`)) {
        return;
    }

    try {
        const res = await API.deleteEmployee(id);
        if (res.success) {
            showToast(`Employee #${id} removed successfully`, 'success');
            await loadEmployees();
        } else {
            showToast(res.message || 'Failed to remove employee', 'error');
        }
    } catch (err) {
        showToast('Error removing employee', 'error');
    }
}
