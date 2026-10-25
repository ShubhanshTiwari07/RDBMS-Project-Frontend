# 🏦 Advanced Banking Management System

[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-3b82f6.svg)](https://developer.mozilla.org/en-US/docs/Web)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-10b981.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MySQL-f59e0b.svg)](https://www.mysql.com/)
[![Architecture](https://img.shields.io/badge/Architecture-REST%20API%20%7C%20ACID%20Compliant-8b5cf6.svg)](https://en.wikipedia.org/wiki/ACID)

An enterprise-grade, full-stack Banking Management System built with a **vanilla HTML5/CSS3/JavaScript** frontend and a robust **Node.js/Express + MySQL** backend. Features real-time liquidity tracking, ACID-compliant inter-account transfers, loan amortization schedules, transaction auditing, and branch network management.

---

## 📸 Overview & Key Modules

| Module | Interface | Description |
|:---|:---|:---|
| **📊 Executive Dashboard** | `frontend/index.html` | Real-time liquidity KPI cards, recent journal settlements, and network health indicators. |
| **👤 Customer Management** | `frontend/customers.html` | Client registration, KYC information, linked account portfolios, and loan profiles. |
| **💳 Account Management** | `frontend/accounts.html` | Savings & Current accounts with dynamic interest rates, minimum balances, overdraft limits, and ledger statements. |
| **💸 Fund Transfers** | `frontend/transfers.html` | Real-time inter-account wire transfers with balance verification and reference number generation. |
| **📋 Transaction History** | `frontend/transactions.html` | Comprehensive audit trail of credits, debits, ATM cash deposits, and payments. |
| **🏛️ Loan Facilities** | `frontend/loans.html` | Loan disbursements, EMI repayments, remaining balance tracking, and status management. |
| **👔 Employee Directory** | `frontend/employees.html` | Human capital management, branch role assignments, and monthly payroll calculations. |
| **🏢 Branch Network** | `frontend/branches.html` | Regional offices, IFSC routing identifiers, physical addresses, and personnel assignment. |

---

## 🎨 Design Theme & UI Architecture

The frontend is styled in a **premium dark banking theme**:
* **Background Primary:** `#0a0e1a` (Deep Navy)
* **Sidebar:** `#111827` (Card Charcoal)
* **Cards & Containers:** `#1f2937` with subtle `rgba(255, 255, 255, 0.08)` borders
* **Primary Accent:** `#3b82f6` (Vibrant Blue)
* **Success Indicator:** `#10b981` (Emerald Green)
* **Warning / Attention:** `#f59e0b` (Amber)
* **Danger / Debit:** `#ef4444` (Rose Red)
* **Typography:** `Inter` font paired with `JetBrains Mono` for currency and IFSC codes

---

## 📁 Project Directory Structure

```
banking-system/
├── frontend/                              ← Clean & Minimal Web Client (HTML/CSS/JS)
│   ├── index.html                         ← Executive Dashboard
│   ├── customers.html                     ← Customer Management
│   ├── accounts.html                      ← Account Management
│   ├── transfers.html                     ← Inter-Account Fund Transfers
│   ├── transactions.html                  ← Transaction History
│   ├── loans.html                         ← Loan Management & EMI Tracking
│   ├── employees.html                     ← Employee Records & Payroll
│   ├── branches.html                      ← Branch Infrastructure & IFSC
│   ├── css/
│   │   └── style.css                      ← Global Dark Banking Theme & Animations
│   └── js/
│       ├── api.js                         ← Central API Client & Offline Demo Fallback
│       ├── dashboard.js                   ← Dashboard KPI Metrics
│       ├── customers.js                   ← Customer CRUD & Profile Drawer
│       ├── accounts.js                    ← Account Openings & Ledger Statements
│       ├── transfers.js                   ← Wire Transfer Execution & Verification
│       ├── transactions.js                ← Credits, Debits & Journal Logging
│       ├── loans.js                       ← Loan Disbursements & EMI Settlements
│       ├── employees.js                   ← Staff Onboarding & Payroll Analytics
│       └── branches.js                    ← Branch Directory & Regional Data
│
├── config/
│   └── db.js                              ← MySQL Connection Pool
├── controllers/                           ← Express Controllers (Business Logic)
│   ├── customerController.js
│   ├── accountController.js
│   ├── transferController.js
│   ├── transactionController.js
│   ├── loanController.js
│   ├── loanPaymentController.js
│   ├── employeeController.js
│   ├── branchController.js
│   └── beneficiaryController.js
├── routes/                                ← Express API Route Definitions
├── sql/
│   └── schema.sql                         ← Relational DDL + Seed Data + Analytical Queries
├── .env.example                           ← Environment Variables Template
├── package.json
└── server.js                              ← Backend Entry Point (Node.js/Express)
```

---

## ⚡ Quick Start Guide (Running on Localhost)

### 1. Prerequisites
* **Node.js** (v16+ LTS)
* **MySQL Server** (v8.0+)
* Modern Web Browser (Chrome, Safari, Edge, Firefox)

---

### 2. Backend Setup & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gunin-11/banking-system.git
   cd banking-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   # On macOS/Linux:
   cp .env.example .env

   # On Windows:
   copy .env.example .env
   ```
   Edit `.env` with your MySQL database credentials:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=banking_system
   ```

4. **Initialize MySQL Database & Seed Data:**
   ```bash
   mysql -u root -p < sql/schema.sql
   ```

5. **Start the Backend API:**
   ```bash
   npm start
   ```
   *The backend will be running at **`http://localhost:3000`**.*

---

### 3. Frontend Setup & Run

Serve the `frontend/` folder on a local web server (port `5500` is recommended):

#### Option A: VS Code Live Server (Easiest)
1. Open the `banking-system/` folder in **VS Code**.
2. Right-click `frontend/index.html` in the file explorer.
3. Select **"Open with Live Server"**.

#### Option B: Python Simple Server
```bash
# Navigate to frontend directory
cd frontend

# Run local HTTP server
python3 -m http.server 5500
```
Open **[http://localhost:5500](http://localhost:5500)** in your browser.

#### Option C: Node.js `serve`
```bash
npx serve frontend -p 5500
```

---

## 🔌 Complete REST API Specification

### Customer Routes (`/api/customers`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/customers` | List all registered customers |
| `GET` | `/api/customers/:id` | Retrieve customer details by ID |
| `POST` | `/api/customers` | Register a new customer |
| `PUT` | `/api/customers/:id` | Update customer details |
| `DELETE` | `/api/customers/:id` | Delete customer and cascade delete accounts |
| `GET` | `/api/customers/:id/accounts` | Retrieve all accounts owned by a customer |
| `GET` | `/api/customers/:id/loans` | Retrieve all loans issued to a customer |
| `GET` | `/api/customers/:id/beneficiaries` | Retrieve saved transfer beneficiaries |

### Account Routes (`/api/accounts`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/accounts` | List all accounts with customer and branch details |
| `GET` | `/api/accounts/:id` | Retrieve single account by ID |
| `POST` | `/api/accounts` | Open a new account (`Savings` or `Current`) |
| `PUT` | `/api/accounts/:id` | Update balance or status (`Active`/`Inactive`/`Closed`) |
| `DELETE` | `/api/accounts/:id` | Close and delete an account |
| `GET` | `/api/accounts/:id/transactions` | Full chronological transaction ledger |
| `GET` | `/api/accounts/:id/transfers` | Wire transfers where account is sender or receiver |

### Fund Transfer Routes (`/api/transfers`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/transfers` | List all completed and pending wire transfers |
| `POST` | `/api/transfers/initiate` | **Initiate ACID Transfer** (Atomically debits sender, credits receiver, logs transactions) |
| `PUT` | `/api/transfers/:id/status` | Update transfer status |

### Transaction Journal Routes (`/api/transactions`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/transactions` | List all system transaction entries |
| `POST` | `/api/transactions` | Record a counter credit or debit entry |
| `DELETE` | `/api/transactions/:id` | Remove a transaction entry |

### Loan & Credit Routes (`/api/loans` & `/api/loan-payments`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/loans` | List all loans with borrower details |
| `GET` | `/api/loans/:id` | Get loan by ID |
| `POST` | `/api/loans` | Disburse a new loan agreement |
| `PUT` | `/api/loans/:id` | Modify loan parameters or status |
| `GET` | `/api/loans/:id/payments` | Retrieve payment receipts for a loan |
| `GET` | `/api/loans/:id/summary` | Query outstanding balance and total repaid |
| `POST` | `/api/loan-payments` | Record an EMI repayment towards an active loan |

### Personnel & Branch Routes (`/api/employees` & `/api/branches`)
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/employees` | List all bank staff members |
| `POST` | `/api/employees` | Onboard a new employee to a branch |
| `PUT` | `/api/employees/:id` | Update employee information or salary |
| `DELETE` | `/api/employees/:id` | Offboard an employee |
| `GET` | `/api/branches` | List all retail branch locations & IFSC codes |
| `POST` | `/api/branches` | Establish a new branch office |
| `GET` | `/api/branches/:id/employees` | View all staff assigned to a branch |
| `GET` | `/api/branches/:id/accounts` | View all client accounts held at a branch |

---

## 🛡️ ACID Compliance & Concurrency in Fund Transfers

The backend executes all fund transfers using **strict database transactions**:
1. Sender balance is locked with `FOR UPDATE` to prevent race conditions.
2. Balance sufficiency is verified before any state changes.
3. Sender is debited and receiver is credited simultaneously.
4. Paired double-entry ledger records are inserted into the `Transaction` table.
5. If any step fails, the transaction is automatically rolled back (`connection.rollback()`).

---

## 👥 Contributors
* **Gunin** — Backend REST API & Database Architecture
* **Shubhansh Tiwari** — Frontend Architecture, UI/UX & Client Integration

---

## 📄 License
This project was developed for educational and academic purposes under the RDBMS Coursework.
# RDBMS-Project-Frontend
# RDBMS-Project-Frontend
# RDBMS-Project-Frontend
