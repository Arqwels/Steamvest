const { Router } = require('express');
const favoriteController = require('../controllers/favoriteController');
const router = Router();

// Список избранного: ?page=1&limit=20&sortBy=price&sortOrder=desc
router.get('/', favoriteController.getFavorites);

// Проверка, в избранном ли скин (для иконки сердечка на списке скинов)
router.get('/check/:skinId', favoriteController.checkFavorite);

// Массовая проверка: body { skinIds: [1, 2, 3, ...] }
router.post('/check-bulk', favoriteController.checkFavoritesBulk);

// Добавить в избранное: body { skinId }
router.post('/', favoriteController.addFavorite);

// Удалить из избранного
router.delete('/:skinId', favoriteController.removeFavorite);

module.exports = router;
