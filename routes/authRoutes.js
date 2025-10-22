const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();
const { register, login } = require("../controllers/authController");
const { validarCpf } = require("../middlewares/validacaoCpfMiddleware");
const { validarEmail } = require("../middlewares/validacaoEmailMiddleware");

// Login normal
router.post("/login", login);

// Registro com validações
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
    failureFlash: true,
  }),
  (req, res) => {
    // Gera token
    const token = jwt.sign(
      { id: req.user.idUser, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Redireciona com BASE_URL dinâmica do .env
    const redirectURL = `${process.env.APP_BASE_URL}/criancas?token=${token}`;
    return res.redirect(redirectURL);
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
