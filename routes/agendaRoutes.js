// routes/agendaRoutes.js
const express = require('express');
const router = express.Router();

const agendaController = require('../controllers/agendaController');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  ensureCanViewCrianca,
  ensureCanEditCrianca,
  ensureCanViewAgenda,
  ensureCanEditAgenda
} = require('../middlewares/permissions');

// Criar (PRECISA ter id_crianca no body) -> só responsável pode criar
router.post('/', authMiddleware, ensureCanEditCrianca, agendaController.create);

// Listar tudo (se for uso admin, mantenha; senão você pode remover essa rota)
router.get('/', authMiddleware, agendaController.getAll);

// Listar por criança -> responsável OU cuidador podem ver
router.get('/crianca/:id_crianca', authMiddleware, ensureCanViewCrianca, agendaController.getByCrianca);

// Buscar por id -> responsável OU cuidador podem ver
router.get('/:idAgenda', authMiddleware, ensureCanViewAgenda, agendaController.getById);

// Atualizar por id -> só responsável
router.put('/:idAgenda', authMiddleware, ensureCanEditAgenda, agendaController.update);

// Deletar por id -> só responsável
router.delete('/:idAgenda', authMiddleware, ensureCanEditAgenda, agendaController.delete);

module.exports = router;
