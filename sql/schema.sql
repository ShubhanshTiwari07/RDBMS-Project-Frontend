-- ==========================================
-- Advanced Banking Management System Schema
-- ==========================================

-- ------------------------------------------
-- Part 1: DDL (Data Definition Language)
-- ------------------------------------------

DROP DATABASE IF EXISTS banking_system;
CREATE DATABASE banking_system;
USE banking_system;

-- 1. Branch Table
CREATE TABLE Branch (
    Branch_ID INT AUTO_INCREMENT PRIMARY KEY,
    Branch_Name VARCHAR(100) NOT NULL,
    IFSC_Code VARCHAR(11) UNIQUE NOT NULL,
    Address VARCHAR(255),
    City VARCHAR(100)
);

-- 2. Customer Table
CREATE TABLE Customer (
    Customer_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    DOB DATE,
    Gender ENUM('Male','Female','Other'),
    Phone VARCHAR(15),
    Email VARCHAR(100) UNIQUE,
    Address VARCHAR(255)
);

-- 3. Account Table
CREATE TABLE Account (
    Account_ID INT AUTO_INCREMENT PRIMARY KEY,
    Account_Number VARCHAR(20) UNIQUE NOT NULL,
    Account_Type ENUM('Savings','Current') NOT NULL,
    Balance DECIMAL(15,2) DEFAULT 0.00,
    Opening_Date DATE NOT NULL,
    Status ENUM('Active','Inactive','Closed') DEFAULT 'Active',
    Customer_ID INT NOT NULL,
    Branch_ID INT NOT NULL,
    FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID) ON DELETE CASCADE,
    FOREIGN KEY (Branch_ID) REFERENCES Branch(Branch_ID) ON DELETE CASCADE
);
CREATE INDEX idx_account_customer ON Account(Customer_ID);
CREATE INDEX idx_account_branch ON Account(Branch_ID);

-- 4. Savings_Account Table
CREATE TABLE Savings_Account (
    Account_ID INT PRIMARY KEY,
    Interest_Rate DECIMAL(5,2),
    Minimum_Balance DECIMAL(15,2),
    FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE
);

-- 5. Current_Account Table
CREATE TABLE Current_Account (
    Account_ID INT PRIMARY KEY,
    Overdraft_Limit DECIMAL(15,2) DEFAULT 0.00,
    FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE
);

-- 6. Employee Table
CREATE TABLE Employee (
    Employee_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Role VARCHAR(50),
    Email VARCHAR(100) UNIQUE,
    Phone VARCHAR(15),
    Salary DECIMAL(12,2),
    Branch_ID INT NOT NULL,
    FOREIGN KEY (Branch_ID) REFERENCES Branch(Branch_ID) ON DELETE CASCADE
);
CREATE INDEX idx_employee_branch ON Employee(Branch_ID);

-- 7. Beneficiary Table
CREATE TABLE Beneficiary (
    Beneficiary_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Account_Number VARCHAR(20) NOT NULL,
    IFSC_Code VARCHAR(11) NOT NULL,
    Nickname VARCHAR(50),
    Customer_ID INT NOT NULL,
    FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID) ON DELETE CASCADE
);
CREATE INDEX idx_beneficiary_customer ON Beneficiary(Customer_ID);

-- 8. Transaction Table
CREATE TABLE Transaction (
    Transaction_ID INT AUTO_INCREMENT PRIMARY KEY,
    Transaction_Type ENUM('Credit','Debit') NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    Transaction_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Description VARCHAR(255),
    Balance_After DECIMAL(15,2),
    Account_ID INT NOT NULL,
    FOREIGN KEY (Account_ID) REFERENCES Account(Account_ID) ON DELETE CASCADE
);
CREATE INDEX idx_transaction_account ON Transaction(Account_ID);
CREATE INDEX idx_transaction_date ON Transaction(Transaction_Date);

-- 9. Transfer Table
CREATE TABLE Transfer (
    Transfer_ID INT AUTO_INCREMENT PRIMARY KEY,
    From_Account_ID INT NOT NULL,
    To_Account_ID INT NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    Transfer_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Pending','Completed','Failed') DEFAULT 'Pending',
    Reference_Number VARCHAR(20) UNIQUE NOT NULL,
    Transaction_ID INT,
    FOREIGN KEY (From_Account_ID) REFERENCES Account(Account_ID),
    FOREIGN KEY (To_Account_ID) REFERENCES Account(Account_ID),
    FOREIGN KEY (Transaction_ID) REFERENCES Transaction(Transaction_ID) ON DELETE SET NULL
);
CREATE INDEX idx_transfer_from_account ON Transfer(From_Account_ID);
CREATE INDEX idx_transfer_to_account ON Transfer(To_Account_ID);

-- 10. Loan Table
CREATE TABLE Loan (
    Loan_ID INT AUTO_INCREMENT PRIMARY KEY,
    Loan_Type VARCHAR(50) NOT NULL,
    Principal_Amount DECIMAL(15,2) NOT NULL,
    Interest_Rate DECIMAL(5,2) NOT NULL,
    Start_Date DATE NOT NULL,
    Status ENUM('Active','Closed','Defaulted') DEFAULT 'Active',
    Customer_ID INT NOT NULL,
    FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID) ON DELETE CASCADE
);
CREATE INDEX idx_loan_customer ON Loan(Customer_ID);

-- 11. Loan_Payment Table
CREATE TABLE Loan_Payment (
    Payment_ID INT AUTO_INCREMENT PRIMARY KEY,
    Payment_Date DATE NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    Loan_ID INT NOT NULL,
    FOREIGN KEY (Loan_ID) REFERENCES Loan(Loan_ID) ON DELETE CASCADE
);
CREATE INDEX idx_loan_payment_loan ON Loan_Payment(Loan_ID);


-- ------------------------------------------
-- Part 2: Seed Data
-- ------------------------------------------

-- Insert Branches
INSERT INTO Branch (Branch_Name, IFSC_Code, Address, City) VALUES
('Mumbai Main', 'BKMUM000001', '123 Nariman Point', 'Mumbai'),
('Delhi Central', 'BKDEL000002', '456 Connaught Place', 'Delhi'),
('Bangalore Tech Park', 'BKBAN000003', '789 Electronic City', 'Bangalore');

-- Insert Customers
INSERT INTO Customer (Name, DOB, Gender, Phone, Email, Address) VALUES
('Rahul Sharma', '1985-06-15', 'Male', '9876543210', 'rahul.s@example.com', 'Andheri West, Mumbai'),
('Priya Patel', '1990-08-22', 'Female', '8765432109', 'priya.p@example.com', 'Koramangala, Bangalore'),
('Amit Singh', '1982-12-05', 'Male', '7654321098', 'amit.singh@example.com', 'Vasant Kunj, Delhi'),
('Neha Gupta', '1995-03-10', 'Female', '6543210987', 'neha.g@example.com', 'Whitefield, Bangalore'),
('Vikram Joshi', '1978-11-28', 'Male', '5432109876', 'vikram.j@example.com', 'Bandra East, Mumbai');

-- Insert Accounts
INSERT INTO Account (Account_Number, Account_Type, Balance, Opening_Date, Status, Customer_ID, Branch_ID) VALUES
('ACC001', 'Savings', 50000.00, '2023-01-10', 'Active', 1, 1),
('ACC002', 'Current', 120000.00, '2022-05-15', 'Active', 1, 1),
('ACC003', 'Savings', 75000.00, '2023-02-20', 'Active', 2, 3),
('ACC004', 'Savings', 30000.00, '2023-04-05', 'Active', 3, 2),
('ACC005', 'Current', 200000.00, '2021-11-12', 'Active', 3, 2),
('ACC006', 'Savings', 45000.00, '2023-06-18', 'Active', 4, 3),
('ACC007', 'Savings', 90000.00, '2022-09-25', 'Active', 5, 1);

-- Insert Savings Accounts
INSERT INTO Savings_Account (Account_ID, Interest_Rate, Minimum_Balance) VALUES
(1, 4.00, 10000.00),
(3, 4.00, 10000.00),
(4, 4.00, 10000.00),
(6, 4.00, 10000.00),
(7, 4.50, 25000.00);

-- Insert Current Accounts
INSERT INTO Current_Account (Account_ID, Overdraft_Limit) VALUES
(2, 50000.00),
(5, 100000.00);

-- Insert Employees
INSERT INTO Employee (Name, Role, Email, Phone, Salary, Branch_ID) VALUES
('Suresh Kumar', 'Branch Manager', 'suresh.k@bank.com', '9988776655', 120000.00, 1),
('Anita Desai', 'Teller', 'anita.d@bank.com', '8877665544', 45000.00, 1),
('Rajesh Verma', 'Branch Manager', 'rajesh.v@bank.com', '7766554433', 115000.00, 2),
('Sneha Rao', 'Loan Officer', 'sneha.r@bank.com', '6655443322', 65000.00, 3),
('Kiran Reddy', 'Teller', 'kiran.r@bank.com', '5544332211', 42000.00, 3);

-- Insert Beneficiaries
INSERT INTO Beneficiary (Name, Account_Number, IFSC_Code, Nickname, Customer_ID) VALUES
('Aarti Sharma', '987654321', 'HDFC0001234', 'Wife', 1),
('Manish Patel', '123456789', 'ICIC0005678', 'Brother', 2),
('Ravi Singh', '456123789', 'SBIN0009012', 'Friend', 3),
('Pooja Joshi', '789456123', 'AXIS0003456', 'Sister', 5);

-- Insert Transactions
INSERT INTO Transaction (Transaction_Type, Amount, Transaction_Date, Description, Balance_After, Account_ID) VALUES
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

-- Insert Transfers
INSERT INTO Transfer (From_Account_ID, To_Account_ID, Amount, Transfer_Date, Status, Reference_Number, Transaction_ID) VALUES
(1, 3, 5000.00, '2023-08-01 10:30:00', 'Completed', 'TRX987654321', NULL),
(2, 5, 15000.00, '2023-08-05 12:45:00', 'Completed', 'TRX123456789', NULL),
(7, 1, 8000.00, '2023-08-10 15:20:00', 'Completed', 'TRX456789123', NULL);

-- Insert Loans
INSERT INTO Loan (Loan_Type, Principal_Amount, Interest_Rate, Start_Date, Status, Customer_ID) VALUES
('Home Loan', 5000000.00, 8.50, '2022-01-15', 'Active', 1),
('Personal Loan', 300000.00, 12.00, '2023-03-10', 'Active', 3),
('Education Loan', 800000.00, 9.50, '2022-08-20', 'Active', 4);

-- Insert Loan Payments
INSERT INTO Loan_Payment (Payment_Date, Amount, Loan_ID) VALUES
('2022-02-15', 45000.00, 1),
('2022-03-15', 45000.00, 1),
('2023-04-10', 10000.00, 2),
('2023-05-10', 10000.00, 2),
('2022-09-20', 15000.00, 3);


-- ------------------------------------------
-- Part 3: Useful Analytical Queries
-- ------------------------------------------

/*
-- 1. Get all accounts for a specific customer (JOIN)
SELECT c.Name, a.Account_Number, a.Account_Type, a.Balance
FROM Customer c
JOIN Account a ON c.Customer_ID = a.Customer_ID
WHERE c.Customer_ID = 1;

-- 2. Get total balance per branch (GROUP BY + JOIN)
SELECT b.Branch_Name, SUM(a.Balance) as Total_Balance
FROM Branch b
JOIN Account a ON b.Branch_ID = a.Branch_ID
GROUP BY b.Branch_Name;

-- 3. Get transaction history for an account (JOIN + ORDER BY)
SELECT t.Transaction_Date, t.Transaction_Type, t.Amount, t.Description, t.Balance_After
FROM Transaction t
JOIN Account a ON t.Account_ID = a.Account_ID
WHERE a.Account_Number = 'ACC001'
ORDER BY t.Transaction_Date DESC;

-- 4. Find customers with loans above a certain amount (subquery)
SELECT Name, Email
FROM Customer
WHERE Customer_ID IN (
    SELECT Customer_ID 
    FROM Loan 
    WHERE Principal_Amount > 500000
);

-- 5. Get total loan payments per loan (GROUP BY + SUM)
SELECT l.Loan_ID, l.Loan_Type, SUM(lp.Amount) as Total_Paid
FROM Loan l
LEFT JOIN Loan_Payment lp ON l.Loan_ID = lp.Loan_ID
GROUP BY l.Loan_ID, l.Loan_Type;

-- 6. Find the branch with the most accounts (GROUP BY + ORDER BY + LIMIT)
SELECT b.Branch_Name, COUNT(a.Account_ID) as Account_Count
FROM Branch b
JOIN Account a ON b.Branch_ID = a.Branch_ID
GROUP BY b.Branch_Name
ORDER BY Account_Count DESC
LIMIT 1;

-- 7. List all transfers between two dates (WHERE + BETWEEN)
SELECT Reference_Number, From_Account_ID, To_Account_ID, Amount, Transfer_Date
FROM Transfer
WHERE Transfer_Date BETWEEN '2023-08-01' AND '2023-08-31';

-- 8. Get employee count per branch (GROUP BY + JOIN)
SELECT b.Branch_Name, COUNT(e.Employee_ID) as Employee_Count
FROM Branch b
LEFT JOIN Employee e ON b.Branch_ID = e.Branch_ID
GROUP BY b.Branch_Name;

-- 9. Find customers who have both savings and current accounts (subquery + HAVING)
SELECT c.Name
FROM Customer c
JOIN Account a ON c.Customer_ID = a.Customer_ID
GROUP BY c.Customer_ID, c.Name
HAVING SUM(CASE WHEN a.Account_Type = 'Savings' THEN 1 ELSE 0 END) > 0
   AND SUM(CASE WHEN a.Account_Type = 'Current' THEN 1 ELSE 0 END) > 0;

-- 10. Calculate remaining loan balance (Principal - SUM of payments)
SELECT l.Loan_ID, c.Name, l.Principal_Amount, 
       COALESCE(SUM(lp.Amount), 0) as Total_Paid,
       (l.Principal_Amount - COALESCE(SUM(lp.Amount), 0)) as Remaining_Balance
FROM Loan l
JOIN Customer c ON l.Customer_ID = c.Customer_ID
LEFT JOIN Loan_Payment lp ON l.Loan_ID = lp.Loan_ID
GROUP BY l.Loan_ID, c.Name, l.Principal_Amount;
*/
