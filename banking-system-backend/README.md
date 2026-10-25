# Advanced Banking Management System — REST API

A production-grade REST API for managing banking operations built with **Node.js**, **Express**, and **MySQL**.

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v14+ | [nodejs.org](https://nodejs.org/) |
| **MySQL** | v8+ | [dev.mysql.com](https://dev.mysql.com/downloads/installer/) |

## Setup & Run

```bash
# 1. Navigate to the project directory
cd banking-system

# 2. Install dependencies
npm install

# 3. Create your .env file (copy from the example)
#    Windows:  copy .env.example .env
#    macOS/Linux: cp .env.example .env
copy .env.example .env

# 4. Edit .env with your MySQL root password
#    DB_HOST=localhost
#    DB_USER=root
#    DB_PASSWORD=your_password
#    DB_NAME=banking_system
#    PORT=3000

# 5. Import the database schema + seed data
mysql -u root -p < sql/schema.sql

# 6. Start the server
npm start

# or for development with auto-reload:
npm run dev
```

The server will start on **http://localhost:3000**.

## Project Structure

```
banking-system/
├── config/
│   └── db.js                  # MySQL connection pool
├── controllers/
│   ├── accountController.js
│   ├── beneficiaryController.js
│   ├── branchController.js
│   ├── customerController.js
│   ├── employeeController.js
│   ├── loanController.js
│   ├── loanPaymentController.js
│   ├── transactionController.js
│   └── transferController.js
├── routes/
│   ├── accountRoutes.js
│   ├── beneficiaryRoutes.js
│   ├── branchRoutes.js
│   ├── customerRoutes.js
│   ├── employeeRoutes.js
│   ├── loanRoutes.js
│   ├── loanPaymentRoutes.js
│   ├── transactionRoutes.js
│   └── transferRoutes.js
├── sql/
│   └── schema.sql             # DDL + seed data + analytical queries
├── .env.example
├── package.json
├── server.js                  # Entry point
└── README.md
```

## API Endpoints

### Customers (`/api/customers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers |
| GET | `/api/customers/:id` | Get customer by ID |
| POST | `/api/customers` | Create a new customer |
| PUT | `/api/customers/:id` | Update a customer |
| DELETE | `/api/customers/:id` | Delete a customer |
| GET | `/api/customers/:id/accounts` | Get all accounts of a customer |
| GET | `/api/customers/:id/beneficiaries` | Get all beneficiaries of a customer |
| GET | `/api/customers/:id/loans` | Get all loans of a customer |

### Accounts (`/api/accounts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all accounts |
| GET | `/api/accounts/:id` | Get account by ID |
| POST | `/api/accounts` | Create a new account (auto-creates Savings/Current sub-record) |
| PUT | `/api/accounts/:id` | Update an account |
| DELETE | `/api/accounts/:id` | Delete an account |
| GET | `/api/accounts/:id/transactions` | Get transaction history for an account |
| GET | `/api/accounts/:id/transfers` | Get all transfers involving an account |
| GET | `/api/accounts/:id/savings-details` | Get savings account details |
| GET | `/api/accounts/:id/current-details` | Get current account details |

### Branches (`/api/branches`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/branches` | List all branches (with employee count) |
| GET | `/api/branches/:id` | Get branch by ID |
| POST | `/api/branches` | Create a new branch |
| PUT | `/api/branches/:id` | Update a branch |
| DELETE | `/api/branches/:id` | Delete a branch |
| GET | `/api/branches/:id/employees` | Get all employees at a branch |
| GET | `/api/branches/:id/accounts` | Get all accounts at a branch |

### Employees (`/api/employees`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| GET | `/api/employees/:id` | Get employee by ID |
| POST | `/api/employees` | Create a new employee |
| PUT | `/api/employees/:id` | Update an employee |
| DELETE | `/api/employees/:id` | Delete an employee |

### Beneficiaries (`/api/beneficiaries`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/beneficiaries` | List all beneficiaries |
| GET | `/api/beneficiaries/:id` | Get beneficiary by ID |
| POST | `/api/beneficiaries` | Create a new beneficiary |
| PUT | `/api/beneficiaries/:id` | Update a beneficiary |
| DELETE | `/api/beneficiaries/:id` | Delete a beneficiary |

### Transactions (`/api/transactions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List all transactions |
| GET | `/api/transactions/:id` | Get transaction by ID |
| POST | `/api/transactions` | Create a transaction (auto-updates account balance) |
| DELETE | `/api/transactions/:id` | Delete a transaction |

### Transfers (`/api/transfers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transfers` | List all transfers |
| GET | `/api/transfers/:id` | Get transfer by ID |
| POST | `/api/transfers/initiate` | **Initiate a fund transfer** (ACID — debits sender, credits receiver, creates transactions) |
| PUT | `/api/transfers/:id/status` | Update transfer status |
| DELETE | `/api/transfers/:id` | Delete a transfer |

### Loans (`/api/loans`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans` | List all loans |
| GET | `/api/loans/:id` | Get loan by ID |
| POST | `/api/loans` | Create a new loan |
| PUT | `/api/loans/:id` | Update a loan |
| DELETE | `/api/loans/:id` | Delete a loan |
| GET | `/api/loans/:id/payments` | Get all payments for a loan |
| GET | `/api/loans/:id/summary` | Get loan summary (total paid, remaining balance) |

### Loan Payments (`/api/loan-payments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loan-payments` | List all loan payments |
| GET | `/api/loan-payments/:id` | Get payment by ID |
| POST | `/api/loan-payments` | Create a loan payment (validates loan is active) |
| PUT | `/api/loan-payments/:id` | Update a payment |
| DELETE | `/api/loan-payments/:id` | Delete a payment |

## Example Requests

### Get all customers
```bash
curl http://localhost:3000/api/customers
```

### Create a customer
```bash
curl -X POST http://localhost:3000/api/customers ^
  -H "Content-Type: application/json" ^
  -d "{\"Name\":\"Sanjay Mehta\",\"DOB\":\"1992-04-15\",\"Gender\":\"Male\",\"Phone\":\"9112345678\",\"Email\":\"sanjay@example.com\",\"Address\":\"MG Road, Pune\"}"
```

### Create a savings account
```bash
curl -X POST http://localhost:3000/api/accounts ^
  -H "Content-Type: application/json" ^
  -d "{\"Account_Type\":\"Savings\",\"Balance\":25000,\"Opening_Date\":\"2024-01-01\",\"Customer_ID\":1,\"Branch_ID\":1,\"Interest_Rate\":4.0,\"Minimum_Balance\":10000}"
```

### Initiate a fund transfer
```bash
curl -X POST http://localhost:3000/api/transfers/initiate ^
  -H "Content-Type: application/json" ^
  -d "{\"From_Account_ID\":1,\"To_Account_ID\":3,\"Amount\":5000,\"Description\":\"Rent payment\"}"
```

### Get a loan summary
```bash
curl http://localhost:3000/api/loans/1/summary
```

### Get customer's accounts
```bash
curl http://localhost:3000/api/customers/1/accounts
```
