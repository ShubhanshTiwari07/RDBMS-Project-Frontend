require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
// Note: These will need to be created or commented out to avoid crashes initially
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/accounts', require('./routes/accountRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/beneficiaries', require('./routes/beneficiaryRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/transfers', require('./routes/transferRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/loan-payments', require('./routes/loanPaymentRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Advanced Banking Management System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database.');
    connection.release();
  } catch (err) {
    console.error('Failed to connect to the database:', err.message);
  }
});
