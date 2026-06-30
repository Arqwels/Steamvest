const { Router } = require('express');
const router = Router();
const authMiddleware = require('../middlewares/authMiddleware');

router.use((req, res, next) => {
  console.log('[Router]', req.method, req.path);
  next();
});

router.use('/admin', require('../dev/adminParserRouter'));

router.use('/skins', authMiddleware, require('./skinsRouter'));
router.use('/investment', authMiddleware, require('./investmentRouter'));
router.use('/portfolio', authMiddleware, require('./portfolioRouter'));
router.use('/sale', authMiddleware, require('./saleRouter'));
router.use('/auth', require('./authRouter'));

// dev-only роуты: монтируем их только если не production
if (process.env.NODE_ENV !== 'production') {
  router.use('/dev', require('../dev/devRouter'));
}

module.exports = router;
