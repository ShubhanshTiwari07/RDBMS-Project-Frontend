const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT b.*, COUNT(e.Employee_ID) as Employee_Count FROM Branch b LEFT JOIN Employee e ON b.Branch_ID = e.Branch_ID GROUP BY b.Branch_ID'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Branch WHERE Branch_ID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { Branch_Name, IFSC_Code, Address, City } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Branch (Branch_Name, IFSC_Code, Address, City) VALUES (?, ?, ?, ?)',
      [Branch_Name, IFSC_Code, Address, City]
    );
    res.status(201).json({ success: true, message: 'Created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { Branch_Name, IFSC_Code, Address, City } = req.body;
    const [result] = await pool.query(
      'UPDATE Branch SET Branch_Name = ?, IFSC_Code = ?, Address = ?, City = ? WHERE Branch_ID = ?',
      [Branch_Name, IFSC_Code, Address, City, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Branch WHERE Branch_ID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Employee WHERE Branch_ID = ?', [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT a.*, c.Name as Customer_Name FROM Account a JOIN Customer c ON a.Customer_ID = c.Customer_ID WHERE a.Branch_ID = ?',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
