// routes/associacaoRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const {
  associarResponsavel,
  associarCuidador
} = require('../controllers/criancaController');

// precisa do token (req.user) pra validar permissões
router.post('/responsavel', authMiddleware, associarResponsavel);
router.post('/cuidador',   authMiddleware, associarCuidador);

module.exports = router;
