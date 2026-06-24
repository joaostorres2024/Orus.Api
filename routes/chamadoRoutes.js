const router = require('express').Router();
const ctrl   = require('../controllers/chamadoController');
const { authMiddleware, adminOnly } = require('../middlewares/auth');
const upload = require('../config/upload');

router.use(authMiddleware);

router.get('/dashboard', ctrl.dashboard);  // todos os logados acessam
router.get('/',          ctrl.listar);                // adm vê todos, user vê os seus
router.get('/:id',       ctrl.buscar);
router.post('/',         ctrl.criar);
router.put('/:id',       adminOnly, ctrl.atualizar);  // só adm muda status/prioridade
router.post('/:id/comentarios', ctrl.comentar);
router.post('/:id/anexos',      upload.single('arquivo'), ctrl.anexar);

module.exports = router;