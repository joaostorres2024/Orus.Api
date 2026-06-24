const router = require('express').Router();
const ctrl   = require('../controllers/estabelecimentoController');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/',      ctrl.listar);
router.get('/:id',   ctrl.buscar);
router.post('/',     adminOnly, ctrl.criar);
router.put('/:id',   adminOnly, ctrl.atualizar);

module.exports = router;