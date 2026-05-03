require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedAdmin = async () => {
  await connectDB();

  const existingAdmin = await User.findOne({ email: 'admin@royalgym.com' });
  if (existingAdmin) {
    console.log('✅ Admin already exists:');
    console.log('   Email   : admin@royalgym.com');
    console.log('   Password: admin123');
    process.exit(0);
  }

  const count = await User.countDocuments();
  const userId = `U${String(count + 1).padStart(3, '0')}`;

  await User.create({
    userId,
    name: 'Admin',
    email: 'admin@royalgym.com',
    password: 'admin123',
    role: 'Admin',
  });

  console.log('🎉 Admin account created!');
  console.log('   Email   : admin@royalgym.com');
  console.log('   Password: admin123');
  process.exit(0);
};

seedAdmin().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
