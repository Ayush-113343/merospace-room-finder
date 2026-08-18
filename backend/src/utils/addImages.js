const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Room = require('../models/Room');
const fs   = require('fs');
const https = require('https');

// Unsplash direct image URLs for each room type
const roomImages = [
  { title: 'Cozy Single Room in Thamel',        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', file: 'room-thamel.jpg' },
  { title: 'Modern Apartment near Patan Durbar', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', file: 'room-patan.jpg' },
  { title: 'Studio Flat in Baneshwor',           url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80', file: 'room-studio1.jpg' },
  { title: 'Spacious Room in Koteshwor',         url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80', file: 'room-koteshwor.jpg' },
  { title: 'Furnished Apartment in Jawalakhel',  url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', file: 'room-jawal.jpg' },
  { title: 'Affordable Room in Bhaktapur',       url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80', file: 'room-bhaktapur.jpg' },
  { title: 'Studio near Tribhuvan University',   url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', file: 'room-studio2.jpg' },
  { title: 'Room with Garden View in Jorpati',   url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', file: 'room-jorpati.jpg' },
  { title: 'Luxury Apartment in Lazimpat',       url: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80', file: 'room-lazimpat.jpg' },
];

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filepath)) { console.log('  Already exists, skipping download'); return resolve(); }
    const file = fs.createWriteStream(filepath);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { fs.unlink(filepath, () => {}); reject(err); });
  });
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  for (const item of roomImages) {
    const filepath = path.join(uploadsDir, item.file);
    console.log(`Processing: ${item.title}`);
    try {
      await downloadImage(item.url, filepath);
      await Room.updateOne({ title: item.title }, { $set: { images: [`/uploads/${item.file}`] } });
      console.log(`  Image set: /uploads/${item.file}`);
    } catch (err) {
      console.log(`  Download failed (${err.message}) — setting placeholder path anyway`);
      await Room.updateOne({ title: item.title }, { $set: { images: [`/uploads/${item.file}`] } });
    }
  }

  console.log('\nDone! Restart the server and refresh the website.');
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
