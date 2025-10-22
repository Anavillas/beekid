// routes/infoCriancaRoutes.js
const express = require('express');
const router = express.Router();

const infoCriancaController = require('../controllers/infoCriancaController');
const authMiddleware = require('../middlewares/authMiddleware');

const {
  ensureCanViewCrianca, // usa id_crianca da rota/body
  ensureCanEditCrianca, // usa id_crianca da rota/body
  ensureCanViewInfo,    // usa idInfo_crianca (carrega do banco)
  ensureCanEditInfo     // usa idInfo_crianca (carrega do banco)
} = require('../middlewares/permissions');

// Criar uma nova informação -> SÓ responsável (precisa enviar id_crianca no body)
router.post('/', authMiddleware, ensureCanEditCrianca, infoCriancaController.create);

// Listar todas as informações (se for uso admin/diagnóstico)
router.get('/', authMiddleware, infoCriancaController.getAll);

// Buscar informações de uma criança específica -> responsável OU cuidador
router.get('/crianca/:id_crianca',
  authMiddleware,
  ensureCanViewCrianca,
  infoCriancaController.getByCrianca
);

// Atualizar informação por ID -> SÓ responsável
router.put('/:idInfo_crianca',
  authMiddleware,
  ensureCanEditInfo, // <-- nome correto
  infoCriancaController.update
);

// Deletar informação por ID -> SÓ responsável
router.delete('/:idInfo_crianca',
  authMiddleware,
  ensureCanEditInfo, // <-- nome correto
  infoCriancaController.delete
);

module.exports = router;
