const express = require('express');
const cors    = require('cors');
require('dotenv').config();
require('./config/db'); // connect database on startup

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ProLink API is running', version: '1.0.0' });
});

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/jobs',     require('./routes/jobs'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/escrow',   require('./routes/escrow'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;