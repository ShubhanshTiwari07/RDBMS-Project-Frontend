const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT a.*, c.Name as Customer_Name, b.Branch_Name FROM Account a JOIN Customer c ON a.Customer_ID = c.Customer_ID JOIN Branch b ON a.Branch_ID = b.Branch_ID'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT a.*, c.Name as Customer_Name, b.Branch_Name FROM Account a JOIN Customer c ON a.Customer_ID = c.Customer_ID JOIN Branch b ON a.Branch_ID = b.Branch_ID WHERE a.Account_ID = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { Account_Type, Balance, Opening_Date, Status, Customer_ID, Branch_ID, Interest_Rate, Minimum_Balance, Overdraft_Limit } = req.body;
    const Account_Number = 'ACC' + Date.now();

    const [accountResult] = await connection.query(
      'INSERT INTO Account (Account_Number, Account_Type, Balance, Opening_Date, Status, Customer_ID, Branch_ID) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [Account_Number, Account_Type, Balance, Opening_Date, Status, Customer_ID, Branch_ID]
    );

    const accountId = accountResult.insertId;

    if (Account_Type === 'Savings' || Account_Type === 'Savings_Account') {
      await connection.query(
        'INSERT INTO Savings_Account (Account_ID, Interest_Rate, Minimum_Balance) VALUES (?, ?, ?)',
        [accountId, Interest_Rate, Minimum_Balance]
      );
    } else if (Account_Type === 'Current' || Account_Type === 'Current_Account') {
      await connection.query(
        'INSERT INTO Current_Account (Account_ID, Overdraft_Limit) VALUES (?, ?)',
        [accountId, Overdraft_Limit]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Created', id: accountId });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.update = async (req, res) => {
  try {
    const { Balance, Status } = req.body;
    const [result] = await pool.query(
      'UPDATE Account SET Balance = ?, Status = ? WHERE Account_ID = ?',
      [Balance, Status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Account WHERE Account_ID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Transaction WHERE Account_ID = ? ORDER BY Transaction_Date DESC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransfers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Transfer WHERE From_Account_ID = ? OR To_Account_ID = ? ORDER BY Transfer_Date DESC',
      [req.params.id, req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSavingsDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT a.*, s.Interest_Rate, s.Minimum_Balance FROM Account a JOIN Savings_Account s ON a.Account_ID = s.Account_ID WHERE a.Account_ID = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCurrentDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT a.*, ca.Overdraft_Limit FROM Account a JOIN Current_Account ca ON a.Account_ID = ca.Account_ID WHERE a.Account_ID = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
