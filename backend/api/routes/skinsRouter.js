const { Router } = require('express');
const skinsController = require('../controllers/skinsController');
const router = Router();

// GET /api/skins/search?q=...
router.get('/search', skinsController.searchSkins);

// GET /api/skins/search-favorite?q=...&limit=20&offset=0
router.get('/search-favorite', skinsController.searchSkinsFavorite);

module.exports = router;
