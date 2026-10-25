const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT lp.*, l.Loan_Type, l.Customer_ID FROM Loan_Payment lp JOIN Loan l ON lp.Loan_ID = l.Loan_ID ORDER BY lp.Payment_Date DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT lp.*, l.Loan_Type, l.Customer_ID FROM Loan_Payment lp JOIN Loan l ON lp.Loan_ID = l.Loan_ID WHERE lp.Payment_ID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { Payment_Date, Amount, Loan_ID } = req.body;
    
    // First verify the Loan exists and is Active
    const [loans] = await pool.query('SELECT Status FROM Loan WHERE Loan_ID = ?', [Loan_ID]);
    if (loans.length === 0) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loans[0].Status !== 'Active') return res.status(400).json({ success: false, message: 'Loan is not active' });
    
    const [result] = await pool.query('INSERT INTO Loan_Payment (Payment_Date, Amount, Loan_ID) VALUES (?, ?, ?)', [Payment_Date, Amount, Loan_ID]);
    res.status(201).json({ success: true, message: 'Created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { Payment_Date, Amount } = req.body;
    const [result] = await pool.query('UPDATE Loan_Payment SET Payment_Date = ?, Amount = ? WHERE Payment_ID = ?', [Payment_Date, Amount, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Loan_Payment WHERE Payment_ID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
