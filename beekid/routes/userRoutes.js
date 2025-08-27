const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Criar um novo usuário
router.post('/', userController.register);

// Listar todos os usuários (protegido)
router.get('/', authMiddleware, userController.getAllUsers);

// Atualizar um usuário por ID (protegido)
router.put('/:idUser', authMiddleware, userController.updateUser);

// Deletar um usuário por ID (protegido)
router.delete('/:idUser', authMiddleware, userController.deleteUser);

module.exports = router;
