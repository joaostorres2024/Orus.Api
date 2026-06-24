const router = require('express').Router();
const ctrl   = require('../controllers/configController');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

router.get('/',  authMiddleware, ctrl.listar);           // qualquer logado pode ler
router.put('/',  authMiddleware, adminOnly, ctrl.atualizar); // só adm edita

module.exports = router;