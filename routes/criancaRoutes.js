// routes/criancaRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const {
  getAllCriancasDoUsuario,
  createCrianca,
  updateCrianca,
  deleteCrianca,
  getCriancaById,
  associarCuidador,
  desassociarCuidador,
  getCuidadoresByCrianca,
  getCuidadoresFullByCrianca    // <- ADICIONE
} = require("../controllers/criancaController");

// Rotas existentes (mantidas)
router.get("/", authMiddleware, getAllCriancasDoUsuario);
router.post("/", authMiddleware, createCrianca);
router.get("/:idCrianca", authMiddleware, getCriancaById);
router.put("/:idCrianca", authMiddleware, updateCrianca);
router.delete("/:idCrianca", authMiddleware, deleteCrianca);

// Cuidadores
router.post("/associar/cuidador", authMiddleware, associarCuidador);
router.get("/:idCrianca/cuidadores", authMiddleware, getCuidadoresByCrianca);

// NOVA ROTA FULL (para a tela perfil-cuidador)
router.get("/:idCrianca/cuidadores/full", authMiddleware, getCuidadoresFullByCrianca);

router.delete("/:idCrianca/cuidadores/:idCuidador", authMiddleware, desassociarCuidador);

module.exports = router;
