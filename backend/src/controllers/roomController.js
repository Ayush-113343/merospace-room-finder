const Room = require('../models/Room');

exports.createRoom = async (req, res) => {
  try {
    const roomData = { ...req.body, owner: req.user.id };
    if (req.files) roomData.images = req.files.map(f => `/uploads/${f.filename}`);
    const room = await Room.create(roomData);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const { location, type, maxBudget, status = 'approved' } = req.query;
    const query = { status };
    if (location) query.location = new RegExp(location, 'i');
    if (type) query.roomType = type;
    if (maxBudget) query.price = { $lte: Number(maxBudget) };

    const rooms = await Room.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('owner', 'name email phone');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, owner: req.user.id });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    Object.assign(room, req.body);
    if (req.files?.length) room.images = req.files.map(f => `/uploads/${f.filename}`);
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    await Room.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.incrementViews = async (req, res) => {
  try {
    await Room.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ message: 'View counted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};