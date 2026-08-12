const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

async function seed() {
  console.log('Connecting to:', process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const exists = await User.findOne({ email: 'admin@merospace.com' });
  if (exists) {
    console.log('✅ Admin already exists:', exists.email);
    return process.exit(0);
  }

  await User.create({
    name: 'System Admin',
    email: 'admin@merospace.com',
    password: 'admin123',
    role: 'admin'
  });

  console.log('✅ Admin created: admin@merospace.com / admin123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
