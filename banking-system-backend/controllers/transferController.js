const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT tf.*, a1.Account_Number as From_Account, a2.Account_Number as To_Account FROM Transfer tf JOIN Account a1 ON tf.From_Account_ID = a1.Account_ID JOIN Account a2 ON tf.To_Account_ID = a2.Account_ID ORDER BY tf.Transfer_Date DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT tf.*, a1.Account_Number as From_Account, a2.Account_Number as To_Account FROM Transfer tf JOIN Account a1 ON tf.From_Account_ID = a1.Account_ID JOIN Account a2 ON tf.To_Account_ID = a2.Account_ID WHERE tf.Transfer_ID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.initiateTransfer = async (req, res) => {
  let connection;
  try {
    const { From_Account_ID, To_Account_ID, Amount, Description } = req.body;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [sender] = await connection.query('SELECT Balance FROM Account WHERE Account_ID = ? FOR UPDATE', [From_Account_ID]);
    if (sender.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Sender account not found' });
    }

    const [receiver] = await connection.query('SELECT Balance FROM Account WHERE Account_ID = ? FOR UPDATE', [To_Account_ID]);
    if (receiver.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Receiver account not found' });
    }

    let senderBalance = parseFloat(sender[0].Balance);
    let amountParsed = parseFloat(Amount);

    if (senderBalance < amountParsed) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    let receiverBalance = parseFloat(receiver[0].Balance);
    let newSenderBalance = senderBalance - amountParsed;
    let newReceiverBalance = receiverBalance + amountParsed;

    await connection.query('UPDATE Account SET Balance = ? WHERE Account_ID = ?', [newSenderBalance, From_Account_ID]);
    await connection.query('UPDATE Account SET Balance = ? WHERE Account_ID = ?', [newReceiverBalance, To_Account_ID]);

    const [debitTx] = await connection.query(
      'INSERT INTO Transaction (Transaction_Type, Amount, Transaction_Date, Description, Balance_After, Account_ID) VALUES (?, ?, NOW(), ?, ?, ?)',
      ['Debit', amountParsed, Description, newSenderBalance, From_Account_ID]
    );

    await connection.query(
      'INSERT INTO Transaction (Transaction_Type, Amount, Transaction_Date, Description, Balance_After, Account_ID) VALUES (?, ?, NOW(), ?, ?, ?)',
      ['Credit', amountParsed, Description, newReceiverBalance, To_Account_ID]
    );

    const refNumber = 'TRF' + Date.now();
    const [transferResult] = await connection.query(
      'INSERT INTO Transfer (From_Account_ID, To_Account_ID, Amount, Transfer_Date, Status, Reference_Number, Transaction_ID) VALUES (?, ?, ?, NOW(), ?, ?, ?)',
      [From_Account_ID, To_Account_ID, amountParsed, 'Completed', refNumber, debitTx.insertId]
    );

    await connection.commit();
    connection.release();
    res.status(201).json({ success: true, message: 'Transfer initiated', id: transferResult.insertId, reference: refNumber });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { Status } = req.body;
    const [result] = await pool.query('UPDATE Transfer SET Status = ? WHERE Transfer_ID = ?', [Status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Transfer WHERE Transfer_ID = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
