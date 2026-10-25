const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Customer');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Customer WHERE Customer_ID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { Name, DOB, Gender, Phone, Email, Address } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Customer (Name, DOB, Gender, Phone, Email, Address) VALUES (?, ?, ?, ?, ?, ?)',
      [Name, DOB, Gender, Phone, Email, Address]
    );
    res.status(201).json({ success: true, message: 'Created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { Name, DOB, Gender, Phone, Email, Address } = req.body;
    const [result] = await pool.query(
      'UPDATE Customer SET Name = ?, DOB = ?, Gender = ?, Phone = ?, Email = ?, Address = ? WHERE Customer_ID = ?',
      [Name, DOB, Gender, Phone, Email, Address, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Customer WHERE Customer_ID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT a.*, b.Branch_Name FROM Account a JOIN Branch b ON a.Branch_ID = b.Branch_ID WHERE a.Customer_ID = ?',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBeneficiaries = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Beneficiary WHERE Customer_ID = ?', [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLoans = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Loan WHERE Customer_ID = ?', [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
