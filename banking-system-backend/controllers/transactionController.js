const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT t.*, a.Account_Number FROM Transaction t JOIN Account a ON t.Account_ID = a.Account_ID ORDER BY t.Transaction_Date DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT t.*, a.Account_Number FROM Transaction t JOIN Account a ON t.Account_ID = a.Account_ID WHERE t.Transaction_ID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  let connection;
  try {
    const { Transaction_Type, Amount, Description, Account_ID } = req.body;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [accounts] = await connection.query('SELECT Balance FROM Account WHERE Account_ID = ? FOR UPDATE', [Account_ID]);
    if (accounts.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    let currentBalance = parseFloat(accounts[0].Balance);
    let amountParsed = parseFloat(Amount);
    let newBalance = currentBalance;

    if (Transaction_Type === 'Debit') {
      if (currentBalance < amountParsed) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
      newBalance = currentBalance - amountParsed;
    } else if (Transaction_Type === 'Credit') {
      newBalance = currentBalance + amountParsed;
    } else {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Invalid Transaction_Type' });
    }

    await connection.query('UPDATE Account SET Balance = ? WHERE Account_ID = ?', [newBalance, Account_ID]);

    const [result] = await connection.query(
      'INSERT INTO Transaction (Transaction_Type, Amount, Transaction_Date, Description, Balance_After, Account_ID) VALUES (?, ?, NOW(), ?, ?, ?)',
      [Transaction_Type, amountParsed, Description, newBalance, Account_ID]
    );

    await connection.commit();
    connection.release();
    res.status(201).json({ success: true, message: 'Created', id: result.insertId });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Transaction WHERE Transaction_ID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
