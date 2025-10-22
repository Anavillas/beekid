const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();
const { register, login } = require("../controllers/authController");
// ✅ Use o middleware de validação de CPF local
const { validarCpf } = require("../middlewares/validacaoCpfMiddleware"); 
// ✅ Importe o middleware de validação de e-mail
const { validarEmail } = require("../middlewares/validacaoEmailMiddleware"); 

// Login normal
router.post("/login", login);

// ✅ Registro com validações de CPF e e-mail
router.post("/register", validarCpf, validarEmail, register);

// =======================
// Login com Google
// =======================

// Inicia autenticação com Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback do Google
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/index.html",
    failureFlash: true, // Adiciona suporte para mensagens de erro
  }),
  (req, res) => {
    // Lógica para gerar o token e redirecionar
    const token = jwt.sign(
      { id: req.user.idUser, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.redirect(`http://beekid.duckdns.org/criancas?token=${token}`);
  }
);

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "✅ Logout realizado!" });
  });
});

console.log("Auth routes carregadas");

module.exports = router;