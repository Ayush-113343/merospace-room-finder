const Favorite = require('../models/Favorite');
const Room = require('../models/Room');

exports.addFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.create({ user: req.user.id, room: req.body.roomId });
    await Room.findByIdAndUpdate(req.body.roomId, { $inc: { favoritesCount: 1 } });
    res.status(201).json(favorite);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Already in favorites' });
    res.status(500).json({ message: err.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ user: req.user.id, room: req.params.roomId });
    await Room.findByIdAndUpdate(req.params.roomId, { $inc: { favoritesCount: -1 } });
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id }).populate('room');
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({ user: req.user.id, room: req.params.roomId });
    res.json({ isFavorite: !!favorite });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};