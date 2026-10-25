#!/usr/bin/env python3
"""
Advanced Banking Management System - Backend Server (Port 3000)
Matches 100% of the Express.js / Node.js API specification & schema
"""

import http.server
import json
import re
import sqlite3
import urllib.parse
from datetime import datetime

PORT = 3000
DB_FILE = 'banking_system.db'

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.executescript('''
    CREATE TABLE IF NOT EXISTS Branch (
        Branch_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Branch_Name TEXT NOT NULL,
        IFSC_Code TEXT UNIQUE NOT NULL,
        Address TEXT,
        City TEXT
    );

    CREATE TABLE IF NOT EXISTS Customer (
        Customer_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        DOB TEXT,
        Gender TEXT,
        Phone TEXT,
        Email TEXT UNIQUE,
        Address TEXT
    );

    CREATE TABLE IF NOT EXISTS Account (
        Account_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Account_Number TEXT UNIQUE NOT NULL,
        Account_Type TEXT NOT NULL,
        Balance REAL DEFAULT 0.00,
        Opening_Date TEXT NOT NULL,
        Status TEXT DEFAULT 'Active',
        Customer_ID INTEGER NOT NULL,
        Branch_ID INTEGER NOT NULL,
        FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID) ON DELETE CASCADE,
        FOREIGN KEY (Branch_ID) REFERENCES Branch(Branch_ID) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Savings_Account (
        Account_ID INTEGER PRIMARY KEY,
        Interest_Rate REAL,
        Minimum_Balance REAL,
        FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Current_Account (
        Account_ID INTEGER PRIMARY KEY,
        Overdraft_Limit REAL DEFAULT 0.00,
        FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Employee (
        Employee_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Role TEXT,
        Email TEXT UNIQUE,
        Phone TEXT,
        Salary REAL,
        Branch_ID INTEGER NOT NULL,
        FOREIGN KEY (Branch_ID) REFERENCES Branch(Branch_ID) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Beneficiary (
        Beneficiary_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Account_Number TEXT NOT NULL,
        IFSC_Code TEXT NOT NULL,
        Nickname TEXT,
        Customer_ID INTEGER NOT NULL,
        FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Transaction_Record (
        Transaction_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Transaction_Type TEXT NOT NULL,
        Amount REAL NOT NULL,
        Transaction_Date TEXT DEFAULT CURRENT_TIMESTAMP,
        Description TEXT,
        Balance_After REAL,
        Account_ID INTEGER NOT NULL,
        FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Transfer (
        Transfer_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        From_Account_ID INTEGER NOT NULL,
        To_Account_ID INTEGER NOT NULL,
        Amount REAL NOT NULL,
        Transfer_Date TEXT DEFAULT CURRENT_TIMESTAMP,
        Status TEXT DEFAULT 'Pending',
        Reference_Number TEXT UNIQUE NOT NULL,
        Transaction_ID INTEGER,
        FOREIGN KEY (From_Account_ID) REFERENCES Account(Account_ID),
        FOREIGN KEY (To_Account_ID) REFERENCES Account(Account_ID)
    );

    CREATE TABLE IF NOT EXISTS Loan (
        Loan_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Loan_Type TEXT NOT NULL,
        Principal_Amount REAL NOT NULL,
        Interest_Rate REAL NOT NULL,
        Start_Date TEXT NOT NULL,
        Status TEXT DEFAULT 'Active',
        Customer_ID INTEGER NOT NULL,
        FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Loan_Payment (
        Payment_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Payment_Date TEXT NOT NULL,
        Amount REAL NOT NULL,
        Loan_ID INTEGER NOT NULL,
        FOREIGN KEY (Loan_ID) REFERENCES Loan(Loan_ID) ON DELETE CASCADE
    );
    ''')

    # Seed data if empty
    cursor.execute('SELECT COUNT(*) FROM Branch')
    if cursor.fetchone()[0] == 0:
        cursor.executescript('''
        INSERT INTO Branch (Branch_Name, IFSC_Code, Address, City) VALUES
        ('Mumbai Main', 'BKMUM000001', '123 Nariman Point', 'Mumbai'),
        ('Delhi Central', 'BKDEL000002', '456 Connaught Place', 'Delhi'),
        ('Bangalore Tech Park', 'BKBAN000003', '789 Electronic City', 'Bangalore');

        INSERT INTO Customer (Name, DOB, Gender, Phone, Email, Address) VALUES
        ('Rahul Sharma', '1985-06-15', 'Male', '9876543210', 'rahul.s@example.com', 'Andheri West, Mumbai'),
        ('Priya Patel', '1990-08-22', 'Female', '8765432109', 'priya.p@example.com', 'Koramangala, Bangalore'),
        ('Amit Singh', '1982-12-05', 'Male', '7654321098', 'amit.singh@example.com', 'Vasant Kunj, Delhi'),
        ('Neha Gupta', '1995-03-10', 'Female', '6543210987', 'neha.g@example.com', 'Whitefield, Bangalore'),
        ('Vikram Joshi', '1978-11-28', 'Male', '5432109876', 'vikram.j@example.com', 'Bandra East, Mumbai');

        INSERT INTO Account (Account_Number, Account_Type, Balance, Opening_Date, Status, Customer_ID, Branch_ID) VALUES
        ('ACC001', 'Savings', 50000.00, '2023-01-10', 'Active', 1, 1),
        ('ACC002', 'Current', 120000.00, '2022-05-15', 'Active', 1, 1),
        ('ACC003', 'Savings', 75000.00, '2023-02-20', 'Active', 2, 3),
        ('ACC004', 'Savings', 30000.00, '2023-04-05', 'Active', 3, 2),
        ('ACC005', 'Current', 200000.00, '2021-11-12', 'Active', 3, 2),
        ('ACC006', 'Savings', 45000.00, '2023-06-18', 'Active', 4, 3),
        ('ACC007', 'Savings', 90000.00, '2022-09-25', 'Active', 5, 1);

        INSERT INTO Savings_Account (Account_ID, Interest_Rate, Minimum_Balance) VALUES
        (1, 4.00, 10000.00),
        (3, 4.00, 10000.00),
        (4, 4.00, 10000.00),
        (6, 4.00, 10000.00),
        (7, 4.50, 25000.00);

        INSERT INTO Current_Account (Account_ID, Overdraft_Limit) VALUES
        (2, 50000.00),
        (5, 100000.00);

        INSERT INTO Employee (Name, Role, Email, Phone, Salary, Branch_ID) VALUES
        ('Suresh Kumar', 'Branch Manager', 'suresh.k@bank.com', '9988776655', 120000.00, 1),
        ('Anita Desai', 'Teller', 'anita.d@bank.com', '8877665544', 45000.00, 1),
        ('Rajesh Verma', 'Branch Manager', 'rajesh.v@bank.com', '7766554433', 115000.00, 2),
        ('Sneha Rao', 'Loan Officer', 'sneha.r@bank.com', '6655443322', 65000.00, 3),
        ('Kiran Reddy', 'Teller', 'kiran.r@bank.com', '5544332211', 42000.00, 3);

        INSERT INTO Beneficiary (Name, Account_Number, IFSC_Code, Nickname, Customer_ID) VALUES
        ('Aarti Sharma', '987654321', 'HDFC0001234', 'Wife', 1),
        ('Manish Patel', '123456789', 'ICIC0005678', 'Brother', 2),
        ('Ravi Singh', '456123789', 'SBIN0009012', 'Friend', 3),
        ('Pooja Joshi', '789456123', 'AXIS0003456', 'Sister', 5);

        INSERT INTO Transaction_Record (Transaction_Type, Amount, Transaction_Date, Description, Balance_After, Account_ID) VALUES
        ('Credit', 10000.00, '2023-07-01 10:00:00', 'Salary Deposit', 60000.00, 1),
        ('Debit', 5000.00, '2023-07-05 14:30:00', 'ATM Withdrawal', 55000.00, 1),
        ('Credit', 25000.00, '2023-07-10 11:15:00', 'Invoice Payment', 145000.00, 2),
        ('Debit', 15000.00, '2023-07-12 16:45:00', 'Vendor Payment', 130000.00, 2),
        ('Credit', 8000.00, '2023-07-15 09:20:00', 'Cash Deposit', 83000.00, 3),
        ('Debit', 3000.00, '2023-07-18 13:10:00', 'Online Purchase', 80000.00, 3),
        ('Credit', 12000.00, '2023-07-20 10:05:00', 'Bonus', 42000.00, 4),
        ('Debit', 4000.00, '2023-07-22 15:50:00', 'Utility Bill', 38000.00, 4),
        ('Credit', 50000.00, '2023-07-25 11:30:00', 'Business Transfer', 250000.00, 5),
        ('Debit', 10000.00, '2023-07-28 14:20:00', 'EMI Payment', 80000.00, 7);

        INSERT INTO Transfer (From_Account_ID, To_Account_ID, Amount, Transfer_Date, Status, Reference_Number, Transaction_ID) VALUES
        (1, 3, 5000.00, '2023-08-01 10:30:00', 'Completed', 'TRX987654321', NULL),
        (2, 5, 15000.00, '2023-08-05 12:45:00', 'Completed', 'TRX123456789', NULL),
        (7, 1, 8000.00, '2023-08-10 15:20:00', 'Completed', 'TRX456789123', NULL);

        INSERT INTO Loan (Loan_Type, Principal_Amount, Interest_Rate, Start_Date, Status, Customer_ID) VALUES
        ('Home Loan', 5000000.00, 8.50, '2022-01-15', 'Active', 1),
        ('Personal Loan', 300000.00, 12.00, '2023-03-10', 'Active', 3),
        ('Education Loan', 800000.00, 9.50, '2022-08-20', 'Active', 4);

        INSERT INTO Loan_Payment (Payment_Date, Amount, Loan_ID) VALUES
        ('2022-02-15', 45000.00, 1),
        ('2022-03-15', 45000.00, 1),
        ('2023-04-10', 10000.00, 2),
        ('2023-05-10', 10000.00, 2),
        ('2022-09-20', 15000.00, 3);
        ''')
    conn.commit()
    conn.close()

class BankAPIHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def respond_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode('utf-8'))

    def get_body(self):
        content_len = int(self.headers.get('Content-Length', 0))
        if content_len > 0:
            raw = self.rfile.read(content_len)
            try:
                return json.loads(raw.decode('utf-8'))
            except:
                return {}
        return {}

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path.rstrip('/')

        if path == '' or path == '/':
            return self.respond_json(200, {"message": "Welcome to the Advanced Banking Management System API"})

        conn = get_db()
        c = conn.cursor()

        try:
            # Branches
            if path == '/api/branches':
                c.execute('''
                    SELECT b.*, COUNT(e.Employee_ID) as Employee_Count 
                    FROM Branch b 
                    LEFT JOIN Employee e ON b.Branch_ID = e.Branch_ID 
                    GROUP BY b.Branch_ID
                ''')
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            m = re.match(r'^/api/branches/(\d+)$', path)
            if m:
                c.execute('SELECT * FROM Branch WHERE Branch_ID = ?', (m.group(1),))
                row = c.fetchone()
                return self.respond_json(200, {"success": True, "data": dict(row)}) if row else self.respond_json(404, {"success": False, "message": "Not found"})

            m = re.match(r'^/api/branches/(\d+)/employees$', path)
            if m:
                c.execute('SELECT * FROM Employee WHERE Branch_ID = ?', (m.group(1),))
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            m = re.match(r'^/api/branches/(\d+)/accounts$', path)
            if m:
                c.execute('''
                    SELECT a.*, c.Name as Customer_Name 
                    FROM Account a 
                    JOIN Customer c ON a.Customer_ID = c.Customer_ID 
                    WHERE a.Branch_ID = ?
                ''', (m.group(1),))
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            # Customers
            if path == '/api/customers':
                c.execute('SELECT * FROM Customer')
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            m = re.match(r'^/api/customers/(\d+)$', path)
            if m:
                c.execute('SELECT * FROM Customer WHERE Customer_ID = ?', (m.group(1),))
                row = c.fetchone()
                return self.respond_json(200, {"success": True, "data": dict(row)}) if row else self.respond_json(404, {"success": False, "message": "Not found"})

            m = re.match(r'^/api/customers/(\d+)/accounts$', path)
            if m:
                c.execute('''
                    SELECT a.*, b.Branch_Name 
                    FROM Account a 
                    JOIN Branch b ON a.Branch_ID = b.Branch_ID 
                    WHERE a.Customer_ID = ?
                ''', (m.group(1),))
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            m = re.match(r'^/api/customers/(\d+)/loans$', path)
            if m:
                c.execute('SELECT * FROM Loan WHERE Customer_ID = ?', (m.group(1),))
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            m = re.match(r'^/api/customers/(\d+)/beneficiaries$', path)
            if m:
                c.execute('SELECT * FROM Beneficiary WHERE Customer_ID = ?', (m.group(1),))
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            # Accounts
            if path == '/api/accounts':
                c.execute('''
                    SELECT a.*, c.Name as Customer_Name, b.Branch_Name 
                    FROM Account a 
                    JOIN Customer c ON a.Customer_ID = c.Customer_ID 
                    JOIN Branch b ON a.Branch_ID = b.Branch_ID
                ''')
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            m = re.match(r'^/api/accounts/(\d+)$', path)
            if m:
                c.execute('''
                    SELECT a.*, c.Name as Customer_Name, b.Branch_Name 
                    FROM Account a 
                    JOIN Customer c ON a.Customer_ID = c.Customer_ID 
                    JOIN Branch b ON a.Branch_ID = b.Branch_ID 
                    WHERE a.Account_ID = ?
                ''', (m.group(1),))
                row = c.fetchone()
                return self.respond_json(200, {"success": True, "data": dict(row)}) if row else self.respond_json(404, {"success": False, "message": "Not found"})

            m = re.match(r'^/api/accounts/(\d+)/transactions$', path)
            if m:
                c.execute('''
                    SELECT * FROM Transaction_Record 
                    WHERE Account_ID = ? 
                    ORDER BY Transaction_Date DESC
                ''', (m.group(1),))
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            m = re.match(r'^/api/accounts/(\d+)/transfers$', path)
            if m:
                acc_id = m.group(1)
                c.execute('''
                    SELECT * FROM Transfer 
                    WHERE From_Account_ID = ? OR To_Account_ID = ? 
                    ORDER BY Transfer_Date DESC
                ''', (acc_id, acc_id))
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            # Transfers
            if path == '/api/transfers':
                c.execute('''
                    SELECT tf.*, a1.Account_Number as From_Account, a2.Account_Number as To_Account 
                    FROM Transfer tf 
                    JOIN Account a1 ON tf.From_Account_ID = a1.Account_ID 
                    JOIN Account a2 ON tf.To_Account_ID = a2.Account_ID 
                    ORDER BY tf.Transfer_Date DESC
                ''')
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            # Transactions
            if path == '/api/transactions':
                c.execute('''
                    SELECT t.*, a.Account_Number 
                    FROM Transaction_Record t 
                    JOIN Account a ON t.Account_ID = a.Account_ID 
                    ORDER BY t.Transaction_Date DESC
                ''')
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            # Loans
            if path == '/api/loans':
                c.execute('''
                    SELECT l.*, c.Name as Customer_Name,
                           COALESCE((SELECT SUM(lp.Amount) FROM Loan_Payment lp WHERE lp.Loan_ID = l.Loan_ID), 0) as Total_Paid,
                           (l.Principal_Amount - COALESCE((SELECT SUM(lp.Amount) FROM Loan_Payment lp WHERE lp.Loan_ID = l.Loan_ID), 0)) as Remaining_Balance
                    FROM Loan l 
                    JOIN Customer c ON l.Customer_ID = c.Customer_ID
                ''')
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            m = re.match(r'^/api/loans/(\d+)/payments$', path)
            if m:
                c.execute('SELECT * FROM Loan_Payment WHERE Loan_ID = ? ORDER BY Payment_Date DESC', (m.group(1),))
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            # Employees
            if path == '/api/employees':
                c.execute('''
                    SELECT e.*, b.Branch_Name 
                    FROM Employee e 
                    JOIN Branch b ON e.Branch_ID = b.Branch_ID
                ''')
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            # Beneficiaries
            if path == '/api/beneficiaries':
                c.execute('''
                    SELECT ben.*, c.Name as Customer_Name 
                    FROM Beneficiary ben 
                    JOIN Customer c ON ben.Customer_ID = c.Customer_ID
                ''')
                return self.respond_json(200, {"success": True, "data": [dict(r) for r in c.fetchall()]})

            self.respond_json(404, {"success": False, "message": "Endpoint not found"})
        except Exception as e:
            self.respond_json(500, {"success": False, "message": str(e)})
        finally:
            conn.close()

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path.rstrip('/')
        body = self.get_body()

        conn = get_db()
        c = conn.cursor()

        try:
            # Customers
            if path == '/api/customers':
                c.execute(
                    'INSERT INTO Customer (Name, DOB, Gender, Phone, Email, Address) VALUES (?, ?, ?, ?, ?, ?)',
                    (body.get('Name'), body.get('DOB'), body.get('Gender'), body.get('Phone'), body.get('Email'), body.get('Address'))
                )
                conn.commit()
                return self.respond_json(201, {"success": True, "message": "Created", "id": c.lastrowid})

            # Accounts
            if path == '/api/accounts':
                acc_num = 'ACC' + str(int(datetime.now().timestamp() * 1000))[-8:]
                c.execute(
                    'INSERT INTO Account (Account_Number, Account_Type, Balance, Opening_Date, Status, Customer_ID, Branch_ID) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    (acc_num, body.get('Account_Type'), float(body.get('Balance', 0)), body.get('Opening_Date'), body.get('Status', 'Active'), int(body.get('Customer_ID')), int(body.get('Branch_ID')))
                )
                acc_id = c.lastrowid
                conn.commit()
                return self.respond_json(201, {"success": True, "message": "Created", "id": acc_id})

            # Transfers Initiate
            if path == '/api/transfers/initiate':
                from_id = int(body.get('From_Account_ID'))
                to_id = int(body.get('To_Account_ID'))
                amount = float(body.get('Amount'))
                desc = body.get('Description', 'Fund Transfer')

                c.execute('SELECT Balance FROM Account WHERE Account_ID = ?', (from_id,))
                sender = c.fetchone()
                c.execute('SELECT Balance FROM Account WHERE Account_ID = ?', (to_id,))
                receiver = c.fetchone()

                if not sender or not receiver:
                    return self.respond_json(404, {"success": False, "message": "Sender or receiver account not found"})

                if sender['Balance'] < amount:
                    return self.respond_json(400, {"success": False, "message": "Insufficient balance"})

                new_sender_bal = sender['Balance'] - amount
                new_recv_bal = receiver['Balance'] + amount

                c.execute('UPDATE Account SET Balance = ? WHERE Account_ID = ?', (new_sender_bal, from_id))
                c.execute('UPDATE Account SET Balance = ? WHERE Account_ID = ?', (new_recv_bal, to_id))

                now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                c.execute(
                    'INSERT INTO Transaction_Record (Transaction_Type, Amount, Transaction_Date, Description, Balance_After, Account_ID) VALUES (?, ?, ?, ?, ?, ?)',
                    ('Debit', amount, now_str, desc, new_sender_bal, from_id)
                )
                debit_id = c.lastrowid

                c.execute(
                    'INSERT INTO Transaction_Record (Transaction_Type, Amount, Transaction_Date, Description, Balance_After, Account_ID) VALUES (?, ?, ?, ?, ?, ?)',
                    ('Credit', amount, now_str, desc, new_recv_bal, to_id)
                )

                ref_num = 'TRF' + str(int(datetime.now().timestamp() * 1000))[-9:]
                c.execute(
                    'INSERT INTO Transfer (From_Account_ID, To_Account_ID, Amount, Transfer_Date, Status, Reference_Number, Transaction_ID) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    (from_id, to_id, amount, now_str, 'Completed', ref_num, debit_id)
                )
                trf_id = c.lastrowid
                conn.commit()
                return self.respond_json(201, {"success": True, "message": "Transfer initiated", "id": trf_id, "reference": ref_num})

            # Transactions
            if path == '/api/transactions':
                acc_id = int(body.get('Account_ID'))
                tx_type = body.get('Transaction_Type')
                amount = float(body.get('Amount'))
                desc = body.get('Description', 'Direct Transaction')

                c.execute('SELECT Balance FROM Account WHERE Account_ID = ?', (acc_id,))
                acc = c.fetchone()
                if not acc:
                    return self.respond_json(404, {"success": False, "message": "Account not found"})

                current_bal = acc['Balance']
                if tx_type == 'Debit':
                    if current_bal < amount:
                        return self.respond_json(400, {"success": False, "message": "Insufficient balance"})
                    new_bal = current_bal - amount
                elif tx_type == 'Credit':
                    new_bal = current_bal + amount
                else:
                    return self.respond_json(400, {"success": False, "message": "Invalid transaction type"})

                c.execute('UPDATE Account SET Balance = ? WHERE Account_ID = ?', (new_bal, acc_id))
                now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                c.execute(
                    'INSERT INTO Transaction_Record (Transaction_Type, Amount, Transaction_Date, Description, Balance_After, Account_ID) VALUES (?, ?, ?, ?, ?, ?)',
                    (tx_type, amount, now_str, desc, new_bal, acc_id)
                )
                tx_id = c.lastrowid
                conn.commit()
                return self.respond_json(201, {"success": True, "message": "Created", "id": tx_id})

            # Loans
            if path == '/api/loans':
                c.execute(
                    'INSERT INTO Loan (Loan_Type, Principal_Amount, Interest_Rate, Start_Date, Customer_ID) VALUES (?, ?, ?, ?, ?)',
                    (body.get('Loan_Type'), float(body.get('Principal_Amount')), float(body.get('Interest_Rate')), body.get('Start_Date'), int(body.get('Customer_ID')))
                )
                conn.commit()
                return self.respond_json(201, {"success": True, "message": "Created", "id": c.lastrowid})

            # Loan Payments
            if path == '/api/loan-payments':
                loan_id = int(body.get('Loan_ID'))
                amount = float(body.get('Amount'))
                date = body.get('Payment_Date')

                c.execute(
                    'INSERT INTO Loan_Payment (Payment_Date, Amount, Loan_ID) VALUES (?, ?, ?)',
                    (date, amount, loan_id)
                )
                conn.commit()
                return self.respond_json(201, {"success": True, "message": "Created", "id": c.lastrowid})

            # Employees
            if path == '/api/employees':
                c.execute(
                    'INSERT INTO Employee (Name, Role, Email, Phone, Salary, Branch_ID) VALUES (?, ?, ?, ?, ?, ?)',
                    (body.get('Name'), body.get('Role'), body.get('Email'), body.get('Phone'), float(body.get('Salary')), int(body.get('Branch_ID')))
                )
                conn.commit()
                return self.respond_json(201, {"success": True, "message": "Created", "id": c.lastrowid})

            # Branches
            if path == '/api/branches':
                c.execute(
                    'INSERT INTO Branch (Branch_Name, IFSC_Code, Address, City) VALUES (?, ?, ?, ?)',
                    (body.get('Branch_Name'), body.get('IFSC_Code'), body.get('Address'), body.get('City'))
                )
                conn.commit()
                return self.respond_json(201, {"success": True, "message": "Created", "id": c.lastrowid})

            self.respond_json(404, {"success": False, "message": "Endpoint not found"})
        except Exception as e:
            self.respond_json(500, {"success": False, "message": str(e)})
        finally:
            conn.close()

    def do_PUT(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path.rstrip('/')
        body = self.get_body()

        conn = get_db()
        c = conn.cursor()

        try:
            m = re.match(r'^/api/customers/(\d+)$', path)
            if m:
                c.execute(
                    'UPDATE Customer SET Name = ?, DOB = ?, Gender = ?, Phone = ?, Email = ?, Address = ? WHERE Customer_ID = ?',
                    (body.get('Name'), body.get('DOB'), body.get('Gender'), body.get('Phone'), body.get('Email'), body.get('Address'), m.group(1))
                )
                conn.commit()
                return self.respond_json(200, {"success": True, "message": "Updated"})

            m = re.match(r'^/api/accounts/(\d+)$', path)
            if m:
                c.execute(
                    'UPDATE Account SET Balance = ?, Status = ? WHERE Account_ID = ?',
                    (float(body.get('Balance')), body.get('Status'), m.group(1))
                )
                conn.commit()
                return self.respond_json(200, {"success": True, "message": "Updated"})

            m = re.match(r'^/api/branches/(\d+)$', path)
            if m:
                c.execute(
                    'UPDATE Branch SET Branch_Name = ?, IFSC_Code = ?, Address = ?, City = ? WHERE Branch_ID = ?',
                    (body.get('Branch_Name'), body.get('IFSC_Code'), body.get('Address'), body.get('City'), m.group(1))
                )
                conn.commit()
                return self.respond_json(200, {"success": True, "message": "Updated"})

            m = re.match(r'^/api/employees/(\d+)$', path)
            if m:
                c.execute(
                    'UPDATE Employee SET Name = ?, Role = ?, Email = ?, Phone = ?, Salary = ?, Branch_ID = ? WHERE Employee_ID = ?',
                    (body.get('Name'), body.get('Role'), body.get('Email'), body.get('Phone'), float(body.get('Salary')), int(body.get('Branch_ID')), m.group(1))
                )
                conn.commit()
                return self.respond_json(200, {"success": True, "message": "Updated"})

            self.respond_json(404, {"success": False, "message": "Endpoint not found"})
        except Exception as e:
            self.respond_json(500, {"success": False, "message": str(e)})
        finally:
            conn.close()

    def do_DELETE(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path.rstrip('/')

        conn = get_db()
        c = conn.cursor()

        try:
            m = re.match(r'^/api/customers/(\d+)$', path)
            if m:
                c.execute('DELETE FROM Customer WHERE Customer_ID = ?', (m.group(1),))
                conn.commit()
                return self.respond_json(200, {"success": True, "message": "Deleted"})

            m = re.match(r'^/api/accounts/(\d+)$', path)
            if m:
                c.execute('DELETE FROM Account WHERE Account_ID = ?', (m.group(1),))
                conn.commit()
                return self.respond_json(200, {"success": True, "message": "Deleted"})

            m = re.match(r'^/api/loans/(\d+)$', path)
            if m:
                c.execute('DELETE FROM Loan WHERE Loan_ID = ?', (m.group(1),))
                conn.commit()
                return self.respond_json(200, {"success": True, "message": "Deleted"})

            m = re.match(r'^/api/employees/(\d+)$', path)
            if m:
                c.execute('DELETE FROM Employee WHERE Employee_ID = ?', (m.group(1),))
                conn.commit()
                return self.respond_json(200, {"success": True, "message": "Deleted"})

            m = re.match(r'^/api/branches/(\d+)$', path)
            if m:
                c.execute('DELETE FROM Branch WHERE Branch_ID = ?', (m.group(1),))
                conn.commit()
                return self.respond_json(200, {"success": True, "message": "Deleted"})

            self.respond_json(404, {"success": False, "message": "Endpoint not found"})
        except Exception as e:
            self.respond_json(500, {"success": False, "message": str(e)})
        finally:
            conn.close()

def run():
    init_db()
    server_address = ('', PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, BankAPIHandler)
    print(f"Backend Server is running on port {PORT}")
    print("Successfully connected to database.")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
