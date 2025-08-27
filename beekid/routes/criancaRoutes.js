// routes/criancaRoutes.js
const express = require("express");
const router = express.Router();
const {
    getAllCriancasDoUsuario,
    createCrianca,
    updateCrianca,
    deleteCrianca,
    getCriancaById,
    associarCuidador // <-- Adicione a função aqui
} = require("../controllers/criancaController");

// Rotas existentes
router.get("/", getAllCriancasDoUsuario);
router.get("/:idCrianca", getCriancaById);
router.post("/", createCrianca);
router.put("/:idCrianca", updateCrianca);
router.delete("/:idCrianca", deleteCrianca);

// <--- ADICIONE A ROTA DE ASSOCIAÇÃO AQUI --->
router.post("/associar/cuidador", associarCuidador);

module.exports = router;