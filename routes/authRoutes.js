const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

router.post('/login', ctrl.login);
router.get('/me',    authMiddleware, ctrl.me);

module.exports = router;