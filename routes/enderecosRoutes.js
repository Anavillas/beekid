const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const enderecoController = require('../controllers/enderecoController');
const { validarEndereco } = require('../middlewares/validacaoEnderecoMiddleware');

router.get('/', authMiddleware, enderecoController.getAll);

// Aqui validamos CEP e enriquecemos o endereço antes de chegar no controller
router.post('/', authMiddleware, validarEndereco, enderecoController.create);

router.put('/:idEndereco', authMiddleware, validarEndereco, enderecoController.update);

router.delete('/:idEndereco', authMiddleware, enderecoController.remove);

module.exports = router;
