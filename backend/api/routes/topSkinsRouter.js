const { Router } = require('express');
const topSkinsController = require('../controllers/topSkinsController');
const router = Router();

// GET /api/top-skins?page=1&limit=20&sortBy=price&sortOrder=desc
router.get('/', topSkinsController.getTopSkins);

module.exports = router;
