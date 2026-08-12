const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getDashboardStats, getAllUsers, updateUser, deleteUser,
  getAllRooms, updateRoomStatus, deleteAnyRoom, toggleFeatureRoom, getAnalytics
} = require('../controllers/adminController');

router.use(auth, admin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/rooms', getAllRooms);
router.put('/rooms/:id/status', updateRoomStatus);
router.delete('/rooms/:id', deleteAnyRoom);
router.put('/rooms/:id/feature', toggleFeatureRoom);
router.get('/analytics', getAnalytics);

module.exports = router;