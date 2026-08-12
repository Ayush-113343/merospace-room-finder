const User = require('../models/User');
const Room = require('../models/Room');
const Favorite = require('../models/Favorite');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRooms = await Room.countDocuments();
    const pendingRooms = await Room.countDocuments({ status: 'pending' });
    const totalFavorites = await Favorite.countDocuments();
    const totalViews = await Room.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]);

    res.json({
      totalUsers,
      totalRooms,
      pendingRooms,
      totalFavorites,
      totalViews: totalViews[0]?.total || 0,
      activeUsers: await User.countDocuments({ isActive: true })
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { isActive, role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive, role }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Room.deleteMany({ owner: req.params.id });
    await Favorite.deleteMany({ user: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAnyRoom = async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    await Favorite.deleteMany({ room: req.params.id });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleFeatureRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    room.isFeatured = !room.isFeatured;
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: last30Days } });
    const newRooms = await Room.countDocuments({ createdAt: { $gte: last30Days } });
    const roomsByType = await Room.aggregate([{ $group: { _id: '$roomType', count: { $sum: 1 } } }]);
    const topLocations = await Room.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json({ newUsers, newRooms, roomsByType, topLocations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};