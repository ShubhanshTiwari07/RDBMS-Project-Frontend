const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT e.*, b.Branch_Name FROM Employee e JOIN Branch b ON e.Branch_ID = b.Branch_ID');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT e.*, b.Branch_Name FROM Employee e JOIN Branch b ON e.Branch_ID = b.Branch_ID WHERE Employee_ID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { Name, Role, Email, Phone, Salary, Branch_ID } = req.body;
    const [result] = await pool.query('INSERT INTO Employee (Name, Role, Email, Phone, Salary, Branch_ID) VALUES (?, ?, ?, ?, ?, ?)', [Name, Role, Email, Phone, Salary, Branch_ID]);
    res.status(201).json({ success: true, message: 'Created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { Name, Role, Email, Phone, Salary, Branch_ID } = req.body;
    const [result] = await pool.query('UPDATE Employee SET Name = ?, Role = ?, Email = ?, Phone = ?, Salary = ?, Branch_ID = ? WHERE Employee_ID = ?', [Name, Role, Email, Phone, Salary, Branch_ID, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Employee WHERE Employee_ID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
