const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Criar uma nova tarefa na agenda (protegido)
router.post('/', authMiddleware, agendaController.create);

// Listar todas as tarefas da agenda (protegido)
router.get('/', authMiddleware, agendaController.getAll);

// Buscar tarefas de uma criança específica (protegido)
router.get('/crianca/:id_crianca', authMiddleware, agendaController.getByCrianca);

// Atualizar uma tarefa da agenda por ID (protegido)
router.put('/:idAgenda', authMiddleware, agendaController.update);

// Deletar uma tarefa da agenda por ID (protegido)
router.delete('/:idAgenda', authMiddleware, agendaController.delete);

module.exports = router;