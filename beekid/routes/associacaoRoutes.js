const express = require('express');
const router = express.Router();

// Aqui você já importou as funções corretamente
const {
  associarResponsavel,
  associarCuidador
} = require('../controllers/criancaController');

// Use diretamente os nomes importados:
router.post('/responsavel', associarResponsavel);
router.post('/cuidador', associarCuidador);

module.exports = router;
