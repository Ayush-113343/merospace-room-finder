const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');

const rooms = [
  { title: 'Cozy Single Room in Thamel', description: 'A bright, well-ventilated single room in the heart of Thamel. Walking distance to restaurants, shops and public transport. Ideal for students and working professionals.', price: 7500, roomType: 'Single Room', location: 'Thamel, Kathmandu', contact: '9841000001', bedrooms: 1, bathrooms: 1, facilities: ['WiFi', 'Water 24/7', 'Attached Bath'], status: 'approved', views: 142 },
  { title: 'Modern Apartment near Patan Durbar', description: 'Spacious 2BHK apartment with mountain views. Fully furnished with modern amenities. Quiet neighbourhood, 5 min walk to Patan Durbar Square.', price: 18000, roomType: 'Apartment', location: 'Patan, Lalitpur', contact: '9841000002', bedrooms: 2, bathrooms: 2, facilities: ['WiFi', 'Parking', 'Kitchen', 'Furnished', 'Balcony'], status: 'approved', views: 98 },
  { title: 'Studio Flat in Baneshwor', description: 'Compact and affordable studio flat perfect for a single occupant. Close to New Baneshwor bus stop and all major offices.', price: 9500, roomType: 'Studio', location: 'Baneshwor, Kathmandu', contact: '9841000003', bedrooms: 1, bathrooms: 1, facilities: ['WiFi', 'Water 24/7', 'Kitchen'], status: 'approved', views: 76 },
  { title: 'Spacious Room in Koteshwor', description: 'Large room with attached bathroom and balcony. Shared kitchen, good water supply, 24/7 security. Near Ring Road.', price: 8000, roomType: 'Single Room', location: 'Koteshwor, Kathmandu', contact: '9841000004', bedrooms: 1, bathrooms: 1, facilities: ['Attached Bath', 'Balcony', 'Water 24/7', 'Parking'], status: 'approved', views: 54 },
  { title: 'Furnished Apartment in Jawalakhel', description: 'Fully furnished 3BHK apartment in a prime Lalitpur location. All appliances included. Great for families or shared living.', price: 25000, roomType: 'Apartment', location: 'Jawalakhel, Lalitpur', contact: '9841000005', bedrooms: 3, bathrooms: 2, facilities: ['WiFi', 'Parking', 'Kitchen', 'Furnished', 'AC', 'Balcony'], status: 'approved', views: 210 },
  { title: 'Affordable Room in Bhaktapur', description: 'Clean and affordable room in old Bhaktapur. Peaceful neighbourhood, good for students. Shared bathroom.', price: 5500, roomType: 'Single Room', location: 'Bhaktapur', contact: '9841000006', bedrooms: 1, bathrooms: 1, facilities: ['Water 24/7'], status: 'approved', views: 33 },
  { title: 'Studio near Tribhuvan University', description: 'Perfect studio for university students. 10-minute walk to TU campus. Includes desk, wardrobe, and WiFi.', price: 8500, roomType: 'Studio', location: 'Kirtipur, Kathmandu', contact: '9841000007', bedrooms: 1, bathrooms: 1, facilities: ['WiFi', 'Furnished', 'Water 24/7'], status: 'approved', views: 89 },
  { title: 'Room with Garden View in Jorpati', description: 'Quiet and spacious room with a garden view. Great for those who prefer a peaceful environment outside the city centre.', price: 7000, roomType: 'Single Room', location: 'Jorpati, Kathmandu', contact: '9841000008', bedrooms: 1, bathrooms: 1, facilities: ['WiFi', 'Balcony', 'Water 24/7'], status: 'approved', views: 45 },
  { title: 'Luxury Apartment in Lazimpat', description: 'Premium 2BHK apartment in Lazimpat diplomatic zone. High-end finishes, 24/7 security, underground parking.', price: 35000, roomType: 'Apartment', location: 'Lazimpat, Kathmandu', contact: '9841000009', bedrooms: 2, bathrooms: 2, facilities: ['WiFi', 'Parking', 'Kitchen', 'Furnished', 'AC', 'Balcony'], status: 'approved', views: 167, isFeatured: true },
  { title: 'Budget Room in Kalanki', description: 'Simple and clean room near Kalanki chowk. Easy access to transportation heading anywhere in the valley.', price: 5000, roomType: 'Single Room', location: 'Kalanki, Kathmandu', contact: '9841000010', bedrooms: 1, bathrooms: 1, facilities: ['Water 24/7'], status: 'pending', views: 0 },
  { title: 'Cozy Studio in Bouddha', description: 'Serene studio apartment near Bouddhanath Stupa. Ideal for those seeking a calm environment with spiritual atmosphere.', price: 10000, roomType: 'Studio', location: 'Bouddha, Kathmandu', contact: '9841000011', bedrooms: 1, bathrooms: 1, facilities: ['WiFi', 'Kitchen', 'Water 24/7'], status: 'pending', views: 0 },
  { title: 'Modern Room in Sanepa', description: 'Well-furnished room in the upscale Sanepa area of Lalitpur. Near embassies and international schools.', price: 12000, roomType: 'Single Room', location: 'Sanepa, Lalitpur', contact: '9841000012', bedrooms: 1, bathrooms: 1, facilities: ['WiFi', 'Attached Bath', 'Furnished', 'AC'], status: 'pending', views: 0 },
];

const users = [
  { name: 'Ram Sharma', email: 'ram@example.com', password: 'password123', role: 'user' },
  { name: 'Sita Thapa', email: 'sita@example.com', password: 'password123', role: 'user' },
  { name: 'Hari Bahadur', email: 'hari@example.com', password: 'password123', role: 'user' },
  { name: 'Gita Rai', email: 'gita@example.com', password: 'password123', role: 'user' },
];

async function seed() {
  console.log('Connecting to:', process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Seed admin
  let admin = await User.findOne({ email: 'admin@merospace.com' });
  if (!admin) {
    admin = await User.create({ name: 'System Admin', email: 'admin@merospace.com', password: 'admin123', role: 'admin' });
    console.log('Admin created: admin@merospace.com / admin123');
  } else {
    console.log('Admin already exists');
  }

  // Seed sample users
  let firstUser = admin;
  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      const created = await User.create(u);
      if (firstUser === admin) firstUser = created;
      console.log('User created:', u.email);
    }
  }

  // Get the first non-admin user for room ownership
  const roomOwner = await User.findOne({ role: 'user' }) || admin;

  // Seed rooms only if none exist
  const roomCount = await Room.countDocuments();
  if (roomCount === 0) {
    for (const r of rooms) {
      await Room.create({ ...r, owner: roomOwner._id });
    }
    console.log(`${rooms.length} sample rooms created`);
  } else {
    console.log(`Rooms already exist (${roomCount}), skipping`);
  }

  console.log('\nDone! You can now log in:');
  console.log('  Admin:  admin@merospace.com / admin123');
  console.log('  User:   ram@example.com / password123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
