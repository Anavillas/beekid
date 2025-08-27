const express = require('express');
const router = express.Router();
const infoCriancaController = require('../controllers/infoCriancaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Criar uma nova informação para a criança (protegido)
router.post('/', authMiddleware, infoCriancaController.create);

// Listar todas as informações (protegido)
router.get('/', authMiddleware, infoCriancaController.getAll);

// Buscar informações de uma criança específica (protegido)
router.get('/crianca/:id_crianca', authMiddleware, infoCriancaController.getByCrianca);

// Atualizar uma informação da criança por ID (protegido)
router.put('/:idInfo_crianca', authMiddleware, infoCriancaController.update);

// Deletar uma informação da criança por ID (protegido)
router.delete('/:idInfo_crianca', authMiddleware, infoCriancaController.delete);

module.exports = router;