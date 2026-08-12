const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  addFavorite, removeFavorite, getFavorites, checkFavorite
} = require('../controllers/favoriteController');

router.post('/', auth, addFavorite);
router.delete('/:roomId', auth, removeFavorite);
router.get('/', auth, getFavorites);
router.get('/:roomId', auth, checkFavorite);

module.exports = router;