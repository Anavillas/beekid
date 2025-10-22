// app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

// ✅ middleware híbrido (sessão OU JWT)
const checkAuthenticated = require("./middlewares/checkAuthenticatedHybrid");
const hydrateUserFromToken = require("./middlewares/hydrateUserFromToken");

// ✅ carregue sequelize a partir dos models (garante associations)
const {
  sequelize,
  Crianca,
  User,
  AssociacaoResponsavelCrianca,
  AssociacaoCuidadorCrianca,
} = require("./models");

const app = express();

/* ========================== Middlewares globais (ANTES das rotas!) ========================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ necessário para ler cookie 'token'
app.use(hydrateUserFromToken);
app.use(express.static(path.join(__dirname, "public")));

/* ========================== EJS + Layouts ========================== */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public", "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

/* ========================== Sessão + Passport (para login por sessão) ========================== */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "uma_chave_segura_padrao",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Disponibiliza dados do usuário nas views quando autenticado por sessão
app.use((req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.locals.nomeUsuario = req.user?.nome || "Nome não disponível";
    res.locals.cpfUsuario = req.user?.cpf || "CPF não disponível";
  }
  next();
});

/* ========================== Rotas de views (agora com checagem HÍBRIDA) ========================== */
app.get("/", (req, res) => res.render("index", { layout: false }));

app.get("/dashboard", checkAuthenticated, (req, res) => {
  res.render("dashboard", { title: "Dashboard" });
});

app.get("/cuidadores", checkAuthenticated, (req, res) => {
  res.render("selecionarCuidador", { title: "Cuidadores" });
});

app.get("/cuidadores/:id", checkAuthenticated, (req, res) => {
  res.render("cuidadores", { title: "Perfil do Cuidador" });
});

app.get("/perfil", checkAuthenticated, (req, res) => {
  res.render("perfil", { title: "Perfil" });
});

// Minhas crianças (apenas cuidadores)
app.get("/minhas-criancas", checkAuthenticated, async (req, res) => {
  if (req.user?.tipoUser !== "CUIDADOR") {
    return res
      .status(403)
      .send("Acesso negado. Esta rota é apenas para cuidadores.");
  }
  try {
    const associacoes = await AssociacaoCuidadorCrianca.findAll({
      where: { id_cuidador: req.user.idUser },
      include: [{ model: Crianca, as: "crianca" }], // ✅ use o alias definido no model
    });

    const criancas = associacoes.map((a) => a.crianca); // ✅ refletindo o alias

    res.render("minhas-criancas-cuidador", {
      title: "Minhas Crianças",
      criancas,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno ao carregar a lista de crianças.");
  }
});

app.get("/criancas", checkAuthenticated, (req, res) => {
  res.render("SelecionarCriancas", { title: "Selecionar Criança" });
});

app.get("/criancas/:id", checkAuthenticated, async (req, res) => {
  try {
    const crianca = await Crianca.findByPk(req.params.id);
    if (!crianca) return res.status(404).send("Criança não encontrada.");
    res.render("criancas", { title: crianca.nome, crianca });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ocorreu um erro interno ao carregar o perfil.");
  }
});

// Logout por sessão
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) console.error(err);
      res.redirect("/");
    });
  });
});

/* ========================== Rotas da API (JWT) ========================== */
// (Mantidas como já estavam — continuam usando seu authMiddleware nas próprias rotas)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/criancas", require("./routes/criancaRoutes"));
app.use("/api/associar", require("./routes/associacaoRoutes"));
app.use("/api/agenda", require("./routes/agendaRoutes"));
app.use("/api/info", require("./routes/infoCriancaRoutes"));
app.use("/api/usuario", require("./routes/usuarioMeRoutes")); // GET/PUT /me
app.use("/api/enderecos", require("./routes/enderecosRoutes")); // CRUD endereços
app.use("/api/cuidadores", require("./routes/cuidadores")); // ✅ corrigido caminho + parênteses

/* ========================== Banco de dados ========================== */
sequelize
  .sync({ alter: false })
  .then(() => console.log("✅ Banco conectado!"))
  .catch((err) => {
    console.error("❌ Erro banco:", err);
    process.exit(1);
  });

/* ========================== Middleware global de erro ========================== */
app.use((err, req, res, next) => {
  console.error(err?.stack || err);
  res.status(500).json({ message: "❌ Algo deu errado!" });
});

/* ========================== Inicialização ========================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
