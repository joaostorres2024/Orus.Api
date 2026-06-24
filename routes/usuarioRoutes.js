const router = require('express').Router();
const ctrl   = require('../controllers/usuarioController');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/',      adminOnly, ctrl.listar);   // só adm lista todos
router.get('/:id',  adminOnly, ctrl.buscar);
router.post('/',    adminOnly, ctrl.criar);
router.put('/:id',  adminOnly, ctrl.atualizar);
router.delete('/:id', adminOnly, ctrl.excluir);

module.exports = router;