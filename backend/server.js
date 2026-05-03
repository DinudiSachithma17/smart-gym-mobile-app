require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Base Route
app.get('/', (req, res) => {
  res.send('Gym Management API is running...');
});

// Import Routes
const authRoutes       = require('./routes/authRoutes');
const packageRoutes    = require('./routes/packageRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const complaintRoutes  = require('./routes/complaintRoutes');
const feedbackRoutes   = require('./routes/feedbackRoutes');
const profileRoutes    = require('./routes/profileRoutes');
const trainerRoutes    = require('./routes/trainerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const classRoutes = require('./routes/classRoutes');

// Use Routes
app.use('/api/auth',        authRoutes);
app.use('/api/packages',    packageRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/complaints',  complaintRoutes);
app.use('/api/feedback',    feedbackRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/trainers',    trainerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/classes',       classRoutes);

// Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
