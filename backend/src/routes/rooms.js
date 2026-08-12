const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createRoom, getRooms, getRoomById, updateRoom, deleteRoom, getMyRooms, incrementViews
} = require('../controllers/roomController');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', auth, upload.array('images', 5), createRoom);
router.get('/', getRooms);
router.get('/my-rooms', auth, getMyRooms);
router.get('/:id', getRoomById);
router.put('/:id', auth, upload.array('images', 5), updateRoom);
router.delete('/:id', auth, deleteRoom);
router.post('/:id/view', incrementViews);

module.exports = router;