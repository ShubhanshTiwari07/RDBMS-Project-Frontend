const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT ben.*, c.Name as Customer_Name FROM Beneficiary ben JOIN Customer c ON ben.Customer_ID = c.Customer_ID');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT ben.*, c.Name as Customer_Name FROM Beneficiary ben JOIN Customer c ON ben.Customer_ID = c.Customer_ID WHERE Beneficiary_ID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { Name, Account_Number, IFSC_Code, Nickname, Customer_ID } = req.body;
    const [result] = await pool.query('INSERT INTO Beneficiary (Name, Account_Number, IFSC_Code, Nickname, Customer_ID) VALUES (?, ?, ?, ?, ?)', [Name, Account_Number, IFSC_Code, Nickname, Customer_ID]);
    res.status(201).json({ success: true, message: 'Created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { Name, Account_Number, IFSC_Code, Nickname, Customer_ID } = req.body;
    const [result] = await pool.query('UPDATE Beneficiary SET Name = ?, Account_Number = ?, IFSC_Code = ?, Nickname = ?, Customer_ID = ? WHERE Beneficiary_ID = ?', [Name, Account_Number, IFSC_Code, Nickname, Customer_ID, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Beneficiary WHERE Beneficiary_ID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
