const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT l.*, c.Name as Customer_Name FROM Loan l JOIN Customer c ON l.Customer_ID = c.Customer_ID');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT l.*, c.Name as Customer_Name FROM Loan l JOIN Customer c ON l.Customer_ID = c.Customer_ID WHERE l.Loan_ID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { Loan_Type, Principal_Amount, Interest_Rate, Start_Date, Customer_ID } = req.body;
    const [result] = await pool.query('INSERT INTO Loan (Loan_Type, Principal_Amount, Interest_Rate, Start_Date, Customer_ID) VALUES (?, ?, ?, ?, ?)', [Loan_Type, Principal_Amount, Interest_Rate, Start_Date, Customer_ID]);
    res.status(201).json({ success: true, message: 'Created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { Loan_Type, Principal_Amount, Interest_Rate, Status } = req.body;
    const [result] = await pool.query('UPDATE Loan SET Loan_Type = ?, Principal_Amount = ?, Interest_Rate = ?, Status = ? WHERE Loan_ID = ?', [Loan_Type, Principal_Amount, Interest_Rate, Status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Loan WHERE Loan_ID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Loan_Payment WHERE Loan_ID = ? ORDER BY Payment_Date DESC', [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLoanSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT l.*, c.Name as Customer_Name, COALESCE(SUM(lp.Amount), 0) as Total_Paid, (l.Principal_Amount - COALESCE(SUM(lp.Amount), 0)) as Remaining_Balance ' +
      'FROM Loan l JOIN Customer c ON l.Customer_ID = c.Customer_ID ' +
      'LEFT JOIN Loan_Payment lp ON l.Loan_ID = lp.Loan_ID ' +
      'WHERE l.Loan_ID = ? GROUP BY l.Loan_ID',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
