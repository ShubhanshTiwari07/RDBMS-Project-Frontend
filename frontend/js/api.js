/**
 * Advanced Banking Management System - Central API Client & Utilities
 * Connects directly to backend at http://localhost:3000/api
 * Includes smart fallback for seamless offline demo and grading presentation
 */

const API_BASE = 'http://localhost:3000/api';

// State management for server connectivity
window.BankingState = {
    isLive: false,
    checkedBackend: false
};

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================================================
// FORMATTING UTILITIES
// ==========================================================================

function formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toISOString().split('T')[0];
    } catch (e) {
        return dateString;
    }
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '—';
    try {
        const d = new Date(dateTimeString);
        if (isNaN(d.getTime())) return dateTimeString;
        return d.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateTimeString;
    }
}

// ==========================================================================
// DEMO / MOCK DATA (Automatically used if backend is not started yet)
// ==========================================================================

const INITIAL_MOCK_DATA = {
    branches: [
        { Branch_ID: 1, Branch_Name: 'Mumbai Main', IFSC_Code: 'BKMUM000001', Address: '123 Nariman Point', City: 'Mumbai', Employee_Count: 2 },
        { Branch_ID: 2, Branch_Name: 'Delhi Central', IFSC_Code: 'BKDEL000002', Address: '456 Connaught Place', City: 'Delhi', Employee_Count: 1 },
        { Branch_ID: 3, Branch_Name: 'Bangalore Tech Park', IFSC_Code: 'BKBAN000003', Address: '789 Electronic City', City: 'Bangalore', Employee_Count: 2 }
    ],
    customers: [
        { Customer_ID: 1, Name: 'Rahul Sharma', DOB: '1985-06-15', Gender: 'Male', Phone: '9876543210', Email: 'rahul.s@example.com', Address: 'Andheri West, Mumbai' },
        { Customer_ID: 2, Name: 'Priya Patel', DOB: '1990-08-22', Gender: 'Female', Phone: '8765432109', Email: 'priya.p@example.com', Address: 'Koramangala, Bangalore' },
        { Customer_ID: 3, Name: 'Amit Singh', DOB: '1982-12-05', Gender: 'Male', Phone: '7654321098', Email: 'amit.singh@example.com', Address: 'Vasant Kunj, Delhi' },
        { Customer_ID: 4, Name: 'Neha Gupta', DOB: '1995-03-10', Gender: 'Female', Phone: '6543210987', Email: 'neha.g@example.com', Address: 'Whitefield, Bangalore' },
        { Customer_ID: 5, Name: 'Vikram Joshi', DOB: '1978-11-28', Gender: 'Male', Phone: '5432109876', Email: 'vikram.j@example.com', Address: 'Bandra East, Mumbai' }
    ],
    accounts: [
        { Account_ID: 1, Account_Number: 'ACC001', Account_Type: 'Savings', Balance: 50000.00, Opening_Date: '2023-01-10', Status: 'Active', Customer_ID: 1, Branch_ID: 1, Customer_Name: 'Rahul Sharma', Branch_Name: 'Mumbai Main', Interest_Rate: 4.00, Minimum_Balance: 10000.00 },
        { Account_ID: 2, Account_Number: 'ACC002', Account_Type: 'Current', Balance: 120000.00, Opening_Date: '2022-05-15', Status: 'Active', Customer_ID: 1, Branch_ID: 1, Customer_Name: 'Rahul Sharma', Branch_Name: 'Mumbai Main', Overdraft_Limit: 50000.00 },
        { Account_ID: 3, Account_Number: 'ACC003', Account_Type: 'Savings', Balance: 75000.00, Opening_Date: '2023-02-20', Status: 'Active', Customer_ID: 2, Branch_ID: 3, Customer_Name: 'Priya Patel', Branch_Name: 'Bangalore Tech Park', Interest_Rate: 4.00, Minimum_Balance: 10000.00 },
        { Account_ID: 4, Account_Number: 'ACC004', Account_Type: 'Savings', Balance: 30000.00, Opening_Date: '2023-04-05', Status: 'Active', Customer_ID: 3, Branch_ID: 2, Customer_Name: 'Amit Singh', Branch_Name: 'Delhi Central', Interest_Rate: 4.00, Minimum_Balance: 10000.00 },
        { Account_ID: 5, Account_Number: 'ACC005', Account_Type: 'Current', Balance: 200000.00, Opening_Date: '2021-11-12', Status: 'Active', Customer_ID: 3, Branch_ID: 2, Customer_Name: 'Amit Singh', Branch_Name: 'Delhi Central', Overdraft_Limit: 100000.00 },
        { Account_ID: 6, Account_Number: 'ACC006', Account_Type: 'Savings', Balance: 45000.00, Opening_Date: '2023-06-18', Status: 'Active', Customer_ID: 4, Branch_ID: 3, Customer_Name: 'Neha Gupta', Branch_Name: 'Bangalore Tech Park', Interest_Rate: 4.00, Minimum_Balance: 10000.00 },
        { Account_ID: 7, Account_Number: 'ACC007', Account_Type: 'Savings', Balance: 90000.00, Opening_Date: '2022-09-25', Status: 'Active', Customer_ID: 5, Branch_ID: 1, Customer_Name: 'Vikram Joshi', Branch_Name: 'Mumbai Main', Interest_Rate: 4.50, Minimum_Balance: 25000.00 }
    ],
    employees: [
        { Employee_ID: 1, Name: 'Suresh Kumar', Role: 'Branch Manager', Email: 'suresh.k@bank.com', Phone: '9988776655', Salary: 120000.00, Branch_ID: 1, Branch_Name: 'Mumbai Main' },
        { Employee_ID: 2, Name: 'Anita Desai', Role: 'Teller', Email: 'anita.d@bank.com', Phone: '8877665544', Salary: 45000.00, Branch_ID: 1, Branch_Name: 'Mumbai Main' },
        { Employee_ID: 3, Name: 'Rajesh Verma', Role: 'Branch Manager', Email: 'rajesh.v@bank.com', Phone: '7766554433', Salary: 115000.00, Branch_ID: 2, Branch_Name: 'Delhi Central' },
        { Employee_ID: 4, Name: 'Sneha Rao', Role: 'Loan Officer', Email: 'sneha.r@bank.com', Phone: '6655443322', Salary: 65000.00, Branch_ID: 3, Branch_Name: 'Bangalore Tech Park' },
        { Employee_ID: 5, Name: 'Kiran Reddy', Role: 'Teller', Email: 'kiran.r@bank.com', Phone: '5544332211', Salary: 42000.00, Branch_ID: 3, Branch_Name: 'Bangalore Tech Park' }
    ],
    transactions: [
        { Transaction_ID: 1, Transaction_Type: 'Credit', Amount: 10000.00, Transaction_Date: '2023-07-01 10:00:00', Description: 'Salary Deposit', Balance_After: 60000.00, Account_ID: 1, Account_Number: 'ACC001' },
        { Transaction_ID: 2, Transaction_Type: 'Debit', Amount: 5000.00, Transaction_Date: '2023-07-05 14:30:00', Description: 'ATM Withdrawal', Balance_After: 55000.00, Account_ID: 1, Account_Number: 'ACC001' },
        { Transaction_ID: 3, Transaction_Type: 'Credit', Amount: 25000.00, Transaction_Date: '2023-07-10 11:15:00', Description: 'Invoice Payment', Balance_After: 145000.00, Account_ID: 2, Account_Number: 'ACC002' },
        { Transaction_ID: 4, Transaction_Type: 'Debit', Amount: 15000.00, Transaction_Date: '2023-07-12 16:45:00', Description: 'Vendor Payment', Balance_After: 130000.00, Account_ID: 2, Account_Number: 'ACC002' },
        { Transaction_ID: 5, Transaction_Type: 'Credit', Amount: 8000.00, Transaction_Date: '2023-07-15 09:20:00', Description: 'Cash Deposit', Balance_After: 83000.00, Account_ID: 3, Account_Number: 'ACC003' },
        { Transaction_ID: 6, Transaction_Type: 'Debit', Amount: 3000.00, Transaction_Date: '2023-07-18 13:10:00', Description: 'Online Purchase', Balance_After: 80000.00, Account_ID: 3, Account_Number: 'ACC003' },
        { Transaction_ID: 7, Transaction_Type: 'Credit', Amount: 12000.00, Transaction_Date: '2023-07-20 10:05:00', Description: 'Bonus', Balance_After: 42000.00, Account_ID: 4, Account_Number: 'ACC004' },
        { Transaction_ID: 8, Transaction_Type: 'Debit', Amount: 4000.00, Transaction_Date: '2023-07-22 15:50:00', Description: 'Utility Bill', Balance_After: 38000.00, Account_ID: 4, Account_Number: 'ACC004' },
        { Transaction_ID: 9, Transaction_Type: 'Credit', Amount: 50000.00, Transaction_Date: '2023-07-25 11:30:00', Description: 'Business Transfer', Balance_After: 250000.00, Account_ID: 5, Account_Number: 'ACC005' },
        { Transaction_ID: 10, Transaction_Type: 'Debit', Amount: 10000.00, Transaction_Date: '2023-07-28 14:20:00', Description: 'EMI Payment', Balance_After: 80000.00, Account_ID: 7, Account_Number: 'ACC007' }
    ],
    transfers: [
        { Transfer_ID: 1, From_Account_ID: 1, To_Account_ID: 3, Amount: 5000.00, Transfer_Date: '2023-08-01 10:30:00', Status: 'Completed', Reference_Number: 'TRX987654321', From_Account: 'ACC001', To_Account: 'ACC003' },
        { Transfer_ID: 2, From_Account_ID: 2, To_Account_ID: 5, Amount: 15000.00, Transfer_Date: '2023-08-05 12:45:00', Status: 'Completed', Reference_Number: 'TRX123456789', From_Account: 'ACC002', To_Account: 'ACC005' },
        { Transfer_ID: 3, From_Account_ID: 7, To_Account_ID: 1, Amount: 8000.00, Transfer_Date: '2023-08-10 15:20:00', Status: 'Completed', Reference_Number: 'TRX456789123', From_Account: 'ACC007', To_Account: 'ACC001' }
    ],
    loans: [
        { Loan_ID: 1, Loan_Type: 'Home Loan', Principal_Amount: 5000000.00, Interest_Rate: 8.50, Start_Date: '2022-01-15', Status: 'Active', Customer_ID: 1, Customer_Name: 'Rahul Sharma', Total_Paid: 90000.00, Remaining_Balance: 4910000.00 },
        { Loan_ID: 2, Loan_Type: 'Personal Loan', Principal_Amount: 300000.00, Interest_Rate: 12.00, Start_Date: '2023-03-10', Status: 'Active', Customer_ID: 3, Customer_Name: 'Amit Singh', Total_Paid: 20000.00, Remaining_Balance: 280000.00 },
        { Loan_ID: 3, Loan_Type: 'Education Loan', Principal_Amount: 800000.00, Interest_Rate: 9.50, Start_Date: '2022-08-20', Status: 'Active', Customer_ID: 4, Customer_Name: 'Neha Gupta', Total_Paid: 15000.00, Remaining_Balance: 785000.00 }
    ],
    loanPayments: [
        { Payment_ID: 1, Payment_Date: '2022-02-15', Amount: 45000.00, Loan_ID: 1 },
        { Payment_ID: 2, Payment_Date: '2022-03-15', Amount: 45000.00, Loan_ID: 1 },
        { Payment_ID: 3, Payment_Date: '2023-04-10', Amount: 10000.00, Loan_ID: 2 },
        { Payment_ID: 4, Payment_Date: '2023-05-10', Amount: 10000.00, Loan_ID: 2 },
        { Payment_ID: 5, Payment_Date: '2022-09-20', Amount: 15000.00, Loan_ID: 3 }
    ]
};

// Local storage storage engine for mock data
function getMockStorage() {
    const stored = localStorage.getItem('BANK_MOCK_DATA');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse mock data from storage', e);
        }
    }
    localStorage.setItem('BANK_MOCK_DATA', JSON.stringify(INITIAL_MOCK_DATA));
    return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
}

function saveMockStorage(data) {
    localStorage.setItem('BANK_MOCK_DATA', JSON.stringify(data));
}

// Update connection status UI
function updateConnectionUI(isOnline) {
    window.BankingState.isLive = isOnline;
    window.BankingState.checkedBackend = true;

    const dot = document.getElementById('connectionDot');
    const label = document.getElementById('connectionLabel');
    const banner = document.getElementById('systemBanner');

    if (dot && label) {
        if (isOnline) {
            dot.className = 'status-dot online';
            label.textContent = 'API Connected (Live)';
            if (banner) banner.style.display = 'none';
        } else {
            dot.className = 'status-dot offline';
            label.textContent = 'Demo Mode (Local)';
            if (banner) {
                banner.className = 'system-banner warning';
                banner.style.display = 'flex';
                banner.innerHTML = `
                    <span>ℹ️ Backend not detected on <code>http://localhost:3000</code>. Using built-in demo storage so all features are interactive!</span>
                    <button class="banner-action-btn" onclick="checkBackendConnection(true)">Retry Connection</button>
                `;
            }
        }
    }
}

// Check backend connectivity
async function checkBackendConnection(forceNotify = false) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/branches`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
            updateConnectionUI(true);
            if (forceNotify) showToast('Connected to Backend API!', 'success');
            return true;
        }
    } catch (e) {
        // Backend is offline
    }
    updateConnectionUI(false);
    if (forceNotify) showToast('Backend API is not running. Demo mode active.', 'info');
    return false;
}

// ==========================================================================
// CORE API REQUEST WRAPPER (Graceful Fallback)
// ==========================================================================

async function apiRequest(endpoint, options = {}, mockHandler = null) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });

        if (response.ok) {
            updateConnectionUI(true);
            const data = await response.json();
            return data;
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server responded with ${response.status}`);
        }
    } catch (err) {
        console.warn(`API call failed for ${endpoint}: ${err.message}. Falling back to demo data.`);
        updateConnectionUI(false);

        if (mockHandler) {
            return await mockHandler();
        }
        return { success: false, message: err.message };
    }
}

// ==========================================================================
// API CLIENT OBJECT
// ==========================================================================

const API = {
    // ----------------------------------------------------------------------
    // CUSTOMERS
    // ----------------------------------------------------------------------
    async getCustomers() {
        return apiRequest('/customers', { method: 'GET' }, () => {
            const db = getMockStorage();
            return { success: true, data: db.customers };
        });
    },

    async getCustomer(id) {
        return apiRequest(`/customers/${id}`, { method: 'GET' }, () => {
            const db = getMockStorage();
            const customer = db.customers.find(c => c.Customer_ID == id);
            return customer ? { success: true, data: customer } : { success: false, message: 'Not found' };
        });
    },

    async createCustomer(data) {
        return apiRequest('/customers', {
            method: 'POST',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const newId = (db.customers.length ? Math.max(...db.customers.map(c => c.Customer_ID)) : 0) + 1;
            const newCust = { Customer_ID: newId, ...data };
            db.customers.push(newCust);
            saveMockStorage(db);
            return { success: true, message: 'Customer created successfully', id: newId };
        });
    },

    async updateCustomer(id, data) {
        return apiRequest(`/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const idx = db.customers.findIndex(c => c.Customer_ID == id);
            if (idx !== -1) {
                db.customers[idx] = { ...db.customers[idx], ...data };
                // Also update joined customer name in accounts and loans
                db.accounts.forEach(a => { if (a.Customer_ID == id) a.Customer_Name = data.Name; });
                db.loans.forEach(l => { if (l.Customer_ID == id) l.Customer_Name = data.Name; });
                saveMockStorage(db);
                return { success: true, message: 'Customer updated successfully' };
            }
            return { success: false, message: 'Customer not found' };
        });
    },

    async deleteCustomer(id) {
        return apiRequest(`/customers/${id}`, { method: 'DELETE' }, () => {
            const db = getMockStorage();
            db.customers = db.customers.filter(c => c.Customer_ID != id);
            // Cascade delete accounts and loans for mock
            const removedAccountIds = db.accounts.filter(a => a.Customer_ID == id).map(a => a.Account_ID);
            db.accounts = db.accounts.filter(a => a.Customer_ID != id);
            db.loans = db.loans.filter(l => l.Customer_ID != id);
            db.transactions = db.transactions.filter(t => !removedAccountIds.includes(t.Account_ID));
            saveMockStorage(db);
            return { success: true, message: 'Customer deleted successfully' };
        });
    },

    async getCustomerAccounts(id) {
        return apiRequest(`/customers/${id}/accounts`, { method: 'GET' }, () => {
            const db = getMockStorage();
            const accounts = db.accounts.filter(a => a.Customer_ID == id);
            return { success: true, data: accounts };
        });
    },

    async getCustomerLoans(id) {
        return apiRequest(`/customers/${id}/loans`, { method: 'GET' }, () => {
            const db = getMockStorage();
            const loans = db.loans.filter(l => l.Customer_ID == id);
            return { success: true, data: loans };
        });
    },

    // ----------------------------------------------------------------------
    // ACCOUNTS
    // ----------------------------------------------------------------------
    async getAccounts() {
        return apiRequest('/accounts', { method: 'GET' }, () => {
            const db = getMockStorage();
            return { success: true, data: db.accounts };
        });
    },

    async getAccount(id) {
        return apiRequest(`/accounts/${id}`, { method: 'GET' }, () => {
            const db = getMockStorage();
            const account = db.accounts.find(a => a.Account_ID == id);
            return account ? { success: true, data: account } : { success: false, message: 'Not found' };
        });
    },

    async createAccount(data) {
        return apiRequest('/accounts', {
            method: 'POST',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const newId = (db.accounts.length ? Math.max(...db.accounts.map(a => a.Account_ID)) : 0) + 1;
            const cust = db.customers.find(c => c.Customer_ID == data.Customer_ID);
            const branch = db.branches.find(b => b.Branch_ID == data.Branch_ID);
            const accNum = 'ACC' + Date.now().toString().slice(-6);

            const newAcc = {
                Account_ID: newId,
                Account_Number: accNum,
                Account_Type: data.Account_Type,
                Balance: parseFloat(data.Balance) || 0,
                Opening_Date: data.Opening_Date || new Date().toISOString().split('T')[0],
                Status: data.Status || 'Active',
                Customer_ID: parseInt(data.Customer_ID),
                Branch_ID: parseInt(data.Branch_ID),
                Customer_Name: cust ? cust.Name : 'Unknown',
                Branch_Name: branch ? branch.Branch_Name : 'Main',
                Interest_Rate: data.Interest_Rate ? parseFloat(data.Interest_Rate) : null,
                Minimum_Balance: data.Minimum_Balance ? parseFloat(data.Minimum_Balance) : null,
                Overdraft_Limit: data.Overdraft_Limit ? parseFloat(data.Overdraft_Limit) : null
            };

            db.accounts.push(newAcc);
            saveMockStorage(db);
            return { success: true, message: 'Account created successfully', id: newId };
        });
    },

    async updateAccount(id, data) {
        return apiRequest(`/accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const idx = db.accounts.findIndex(a => a.Account_ID == id);
            if (idx !== -1) {
                db.accounts[idx] = {
                    ...db.accounts[idx],
                    Balance: parseFloat(data.Balance),
                    Status: data.Status
                };
                saveMockStorage(db);
                return { success: true, message: 'Account updated successfully' };
            }
            return { success: false, message: 'Account not found' };
        });
    },

    async deleteAccount(id) {
        return apiRequest(`/accounts/${id}`, { method: 'DELETE' }, () => {
            const db = getMockStorage();
            db.accounts = db.accounts.filter(a => a.Account_ID != id);
            db.transactions = db.transactions.filter(t => t.Account_ID != id);
            saveMockStorage(db);
            return { success: true, message: 'Account deleted successfully' };
        });
    },

    // ----------------------------------------------------------------------
    // TRANSFERS
    // ----------------------------------------------------------------------
    async getTransfers() {
        return apiRequest('/transfers', { method: 'GET' }, () => {
            const db = getMockStorage();
            return { success: true, data: db.transfers };
        });
    },

    async initiateTransfer(data) {
        return apiRequest('/transfers/initiate', {
            method: 'POST',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const fromAcc = db.accounts.find(a => a.Account_ID == data.From_Account_ID);
            const toAcc = db.accounts.find(a => a.Account_ID == data.To_Account_ID);
            const amount = parseFloat(data.Amount);

            if (!fromAcc) return { success: false, message: 'Sender account not found' };
            if (!toAcc) return { success: false, message: 'Receiver account not found' };
            if (fromAcc.Account_ID === toAcc.Account_ID) return { success: false, message: 'Cannot transfer to the same account' };
            if (fromAcc.Balance < amount) return { success: false, message: 'Insufficient balance' };

            fromAcc.Balance -= amount;
            toAcc.Balance += amount;

            const now = new Date().toISOString().replace('T', ' ').split('.')[0];
            const refNumber = 'TRF' + Date.now().toString().slice(-9);

            // Record Debit Transaction
            const txId1 = (db.transactions.length ? Math.max(...db.transactions.map(t => t.Transaction_ID)) : 0) + 1;
            db.transactions.unshift({
                Transaction_ID: txId1,
                Transaction_Type: 'Debit',
                Amount: amount,
                Transaction_Date: now,
                Description: data.Description || `Transfer to ${toAcc.Account_Number}`,
                Balance_After: fromAcc.Balance,
                Account_ID: fromAcc.Account_ID,
                Account_Number: fromAcc.Account_Number
            });

            // Record Credit Transaction
            const txId2 = txId1 + 1;
            db.transactions.unshift({
                Transaction_ID: txId2,
                Transaction_Type: 'Credit',
                Amount: amount,
                Transaction_Date: now,
                Description: data.Description || `Transfer from ${fromAcc.Account_Number}`,
                Balance_After: toAcc.Balance,
                Account_ID: toAcc.Account_ID,
                Account_Number: toAcc.Account_Number
            });

            // Record Transfer
            const transferId = (db.transfers.length ? Math.max(...db.transfers.map(tr => tr.Transfer_ID)) : 0) + 1;
            const newTransfer = {
                Transfer_ID: transferId,
                From_Account_ID: fromAcc.Account_ID,
                To_Account_ID: toAcc.Account_ID,
                Amount: amount,
                Transfer_Date: now,
                Status: 'Completed',
                Reference_Number: refNumber,
                From_Account: fromAcc.Account_Number,
                To_Account: toAcc.Account_Number
            };
            db.transfers.unshift(newTransfer);

            saveMockStorage(db);
            return { success: true, message: 'Transfer completed successfully', reference: refNumber };
        });
    },

    // ----------------------------------------------------------------------
    // TRANSACTIONS
    // ----------------------------------------------------------------------
    async getTransactions() {
        return apiRequest('/transactions', { method: 'GET' }, () => {
            const db = getMockStorage();
            return { success: true, data: db.transactions };
        });
    },

    async createTransaction(data) {
        return apiRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const account = db.accounts.find(a => a.Account_ID == data.Account_ID);
            const amount = parseFloat(data.Amount);

            if (!account) return { success: false, message: 'Account not found' };
            if (data.Transaction_Type === 'Debit') {
                if (account.Balance < amount) return { success: false, message: 'Insufficient balance' };
                account.Balance -= amount;
            } else if (data.Transaction_Type === 'Credit') {
                account.Balance += amount;
            } else {
                return { success: false, message: 'Invalid transaction type' };
            }

            const now = new Date().toISOString().replace('T', ' ').split('.')[0];
            const txId = (db.transactions.length ? Math.max(...db.transactions.map(t => t.Transaction_ID)) : 0) + 1;
            const newTx = {
                Transaction_ID: txId,
                Transaction_Type: data.Transaction_Type,
                Amount: amount,
                Transaction_Date: now,
                Description: data.Description || 'Direct Transaction',
                Balance_After: account.Balance,
                Account_ID: account.Account_ID,
                Account_Number: account.Account_Number
            };

            db.transactions.unshift(newTx);
            saveMockStorage(db);
            return { success: true, message: 'Transaction recorded successfully', id: txId };
        });
    },

    // ----------------------------------------------------------------------
    // LOANS & PAYMENTS
    // ----------------------------------------------------------------------
    async getLoans() {
        return apiRequest('/loans', { method: 'GET' }, () => {
            const db = getMockStorage();
            return { success: true, data: db.loans };
        });
    },

    async getLoan(id) {
        return apiRequest(`/loans/${id}`, { method: 'GET' }, () => {
            const db = getMockStorage();
            const loan = db.loans.find(l => l.Loan_ID == id);
            return loan ? { success: true, data: loan } : { success: false, message: 'Not found' };
        });
    },

    async createLoan(data) {
        return apiRequest('/loans', {
            method: 'POST',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const newId = (db.loans.length ? Math.max(...db.loans.map(l => l.Loan_ID)) : 0) + 1;
            const customer = db.customers.find(c => c.Customer_ID == data.Customer_ID);
            const principal = parseFloat(data.Principal_Amount);

            const newLoan = {
                Loan_ID: newId,
                Loan_Type: data.Loan_Type,
                Principal_Amount: principal,
                Interest_Rate: parseFloat(data.Interest_Rate),
                Start_Date: data.Start_Date || new Date().toISOString().split('T')[0],
                Status: 'Active',
                Customer_ID: parseInt(data.Customer_ID),
                Customer_Name: customer ? customer.Name : 'Customer',
                Total_Paid: 0,
                Remaining_Balance: principal
            };

            db.loans.push(newLoan);
            saveMockStorage(db);
            return { success: true, message: 'Loan created successfully', id: newId };
        });
    },

    async updateLoan(id, data) {
        return apiRequest(`/loans/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const idx = db.loans.findIndex(l => l.Loan_ID == id);
            if (idx !== -1) {
                db.loans[idx] = {
                    ...db.loans[idx],
                    Loan_Type: data.Loan_Type,
                    Principal_Amount: parseFloat(data.Principal_Amount),
                    Interest_Rate: parseFloat(data.Interest_Rate),
                    Status: data.Status
                };
                saveMockStorage(db);
                return { success: true, message: 'Loan updated successfully' };
            }
            return { success: false, message: 'Loan not found' };
        });
    },

    async deleteLoan(id) {
        return apiRequest(`/loans/${id}`, { method: 'DELETE' }, () => {
            const db = getMockStorage();
            db.loans = db.loans.filter(l => l.Loan_ID != id);
            db.loanPayments = db.loanPayments.filter(p => p.Loan_ID != id);
            saveMockStorage(db);
            return { success: true, message: 'Loan deleted successfully' };
        });
    },

    async getLoanPayments(id) {
        return apiRequest(`/loans/${id}/payments`, { method: 'GET' }, () => {
            const db = getMockStorage();
            const payments = db.loanPayments.filter(p => p.Loan_ID == id);
            return { success: true, data: payments };
        });
    },

    async createLoanPayment(data) {
        return apiRequest('/loan-payments', {
            method: 'POST',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const loan = db.loans.find(l => l.Loan_ID == data.Loan_ID);
            if (!loan) return { success: false, message: 'Loan not found' };
            if (loan.Status !== 'Active') return { success: false, message: 'Loan is not active' };

            const paymentAmount = parseFloat(data.Amount);
            const paymentId = (db.loanPayments.length ? Math.max(...db.loanPayments.map(p => p.Payment_ID)) : 0) + 1;

            db.loanPayments.unshift({
                Payment_ID: paymentId,
                Payment_Date: data.Payment_Date || new Date().toISOString().split('T')[0],
                Amount: paymentAmount,
                Loan_ID: parseInt(data.Loan_ID)
            });

            loan.Total_Paid = (parseFloat(loan.Total_Paid) || 0) + paymentAmount;
            loan.Remaining_Balance = Math.max(0, loan.Principal_Amount - loan.Total_Paid);
            if (loan.Remaining_Balance <= 0) loan.Status = 'Closed';

            saveMockStorage(db);
            return { success: true, message: 'Payment recorded successfully', id: paymentId };
        });
    },

    // ----------------------------------------------------------------------
    // EMPLOYEES
    // ----------------------------------------------------------------------
    async getEmployees() {
        return apiRequest('/employees', { method: 'GET' }, () => {
            const db = getMockStorage();
            return { success: true, data: db.employees };
        });
    },

    async createEmployee(data) {
        return apiRequest('/employees', {
            method: 'POST',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const newId = (db.employees.length ? Math.max(...db.employees.map(e => e.Employee_ID)) : 0) + 1;
            const branch = db.branches.find(b => b.Branch_ID == data.Branch_ID);

            const newEmp = {
                Employee_ID: newId,
                Name: data.Name,
                Role: data.Role,
                Email: data.Email,
                Phone: data.Phone,
                Salary: parseFloat(data.Salary) || 0,
                Branch_ID: parseInt(data.Branch_ID),
                Branch_Name: branch ? branch.Branch_Name : 'Branch'
            };

            db.employees.push(newEmp);
            if (branch) branch.Employee_Count = (branch.Employee_Count || 0) + 1;
            saveMockStorage(db);
            return { success: true, message: 'Employee added successfully', id: newId };
        });
    },

    async updateEmployee(id, data) {
        return apiRequest(`/employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const idx = db.employees.findIndex(e => e.Employee_ID == id);
            if (idx !== -1) {
                const branch = db.branches.find(b => b.Branch_ID == data.Branch_ID);
                db.employees[idx] = {
                    ...db.employees[idx],
                    ...data,
                    Salary: parseFloat(data.Salary),
                    Branch_ID: parseInt(data.Branch_ID),
                    Branch_Name: branch ? branch.Branch_Name : db.employees[idx].Branch_Name
                };
                saveMockStorage(db);
                return { success: true, message: 'Employee updated successfully' };
            }
            return { success: false, message: 'Employee not found' };
        });
    },

    async deleteEmployee(id) {
        return apiRequest(`/employees/${id}`, { method: 'DELETE' }, () => {
            const db = getMockStorage();
            db.employees = db.employees.filter(e => e.Employee_ID != id);
            saveMockStorage(db);
            return { success: true, message: 'Employee deleted successfully' };
        });
    },

    // ----------------------------------------------------------------------
    // BRANCHES
    // ----------------------------------------------------------------------
    async getBranches() {
        return apiRequest('/branches', { method: 'GET' }, () => {
            const db = getMockStorage();
            return { success: true, data: db.branches };
        });
    },

    async createBranch(data) {
        return apiRequest('/branches', {
            method: 'POST',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const newId = (db.branches.length ? Math.max(...db.branches.map(b => b.Branch_ID)) : 0) + 1;
            const newBranch = {
                Branch_ID: newId,
                Branch_Name: data.Branch_Name,
                IFSC_Code: data.IFSC_Code,
                Address: data.Address,
                City: data.City,
                Employee_Count: 0
            };
            db.branches.push(newBranch);
            saveMockStorage(db);
            return { success: true, message: 'Branch created successfully', id: newId };
        });
    },

    async updateBranch(id, data) {
        return apiRequest(`/branches/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }, () => {
            const db = getMockStorage();
            const idx = db.branches.findIndex(b => b.Branch_ID == id);
            if (idx !== -1) {
                db.branches[idx] = {
                    ...db.branches[idx],
                    ...data
                };
                saveMockStorage(db);
                return { success: true, message: 'Branch updated successfully' };
            }
            return { success: false, message: 'Branch not found' };
        });
    },

    async deleteBranch(id) {
        return apiRequest(`/branches/${id}`, { method: 'DELETE' }, () => {
            const db = getMockStorage();
            db.branches = db.branches.filter(b => b.Branch_ID != id);
            saveMockStorage(db);
            return { success: true, message: 'Branch deleted successfully' };
        });
    },

    // ----------------------------------------------------------------------
    // DASHBOARD STATS AGGREGATOR
    // ----------------------------------------------------------------------
    async getDashboardStats() {
        try {
            const [customersRes, accountsRes, branchesRes, loansRes, transactionsRes] = await Promise.all([
                this.getCustomers(),
                this.getAccounts(),
                this.getBranches(),
                this.getLoans(),
                this.getTransactions()
            ]);

            const customers = customersRes.data || [];
            const accounts = accountsRes.data || [];
            const branches = branchesRes.data || [];
            const loans = loansRes.data || [];
            const transactions = transactionsRes.data || [];

            const totalBalance = accounts.reduce((acc, curr) => acc + (parseFloat(curr.Balance) || 0), 0);
            const totalLoans = loans.reduce((acc, curr) => acc + (parseFloat(curr.Principal_Amount) || 0), 0);

            return {
                totalCustomers: customers.length,
                totalAccounts: accounts.length,
                totalBranches: branches.length,
                totalLoans: loans.length,
                totalBalance: totalBalance,
                totalLoanVolume: totalLoans,
                recentTransactions: transactions.slice(0, 7)
            };
        } catch (e) {
            console.error('Failed to compute dashboard stats', e);
            return {
                totalCustomers: 0,
                totalAccounts: 0,
                totalBranches: 0,
                totalLoans: 0,
                totalBalance: 0,
                totalLoanVolume: 0,
                recentTransactions: []
            };
        }
    }
};

// Check backend on load
document.addEventListener('DOMContentLoaded', () => {
    checkBackendConnection(false);
});
