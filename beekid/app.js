require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const sequelize = require("./config/db");
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const jwt = require("jsonwebtoken");
const { Crianca, User, AssociacaoResponsavelCrianca, AssociacaoCuidadorCrianca } = require('./models');

const app = express();

// Configuração do EJS + Layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middlewares globais
app.use(cors());
app.use(express.json());

// Arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Sessão (antes do Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || "uma_chave_segura_padrao",
  resave: false,
  saveUninitialized: true
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware para tornar o usuário disponível nas views
app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.nomeUsuario = req.user.nome || "Nome não disponível";
        res.locals.cpfUsuario = req.user.cpf || "CPF não disponível";
    }
    next();
});

// Função de middleware para verificar se o usuário está autenticado
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

// Rotas de views
app.get('/', (req, res) => res.render('index', { layout: false }));
app.get('/dashboard', checkAuthenticated, (req, res) => res.render('dashboard', { title: "Dashboard" }));
app.get('/cuidadores', checkAuthenticated, (req, res) => res.render('cuidadores', { title: "Cuidadores" }));

// Rota para a página de seleção de crianças
app.get('/criancas', checkAuthenticated, (req, res) => {
    res.render('SelecionarCriancas', { title: "Selecionar Criança" });
});

// Rota CORRIGIDA para o perfil de uma criança específica
app.get('/criancas/:id', checkAuthenticated, async (req, res) => {
  try {
    const criancaId = req.params.id;
    
    // 1. Busca a criança no banco de dados usando o ID
    const crianca = await Crianca.findByPk(criancaId);

    // 2. Verifica se a criança existe
    if (!crianca) {
      return res.status(404).send("Criança não encontrada.");
    }
    
    // 3. Renderiza a página e PASSA o objeto da criança para a view
    res.render('criancas', { 
        title: crianca.nome,
        crianca: crianca // A variável 'crianca' é enviada para o arquivo ejs
    });

  } catch (error) {
    // Se houver qualquer erro na busca, ele será pego aqui
    console.error("Erro ao carregar perfil da criança:", error);
    res.status(500).send("Ocorreu um erro interno ao carregar o perfil.");
  }
});

// Exemplo da função de verificação de permissão no back-end
async function verificarPermissao(userId, criancaId) {
    const isResponsavel = await AssociacaoResponsavelCrianca.findOne({
        where: { id_responsavel: userId, id_crianca: criancaId }
    });

    const isCuidador = await AssociacaoCuidadorCrianca.findOne({
        where: { id_cuidador: userId, id_crianca: criancaId }
    });

    return isResponsavel || isCuidador;
}

app.get('/perfil', checkAuthenticated, (req, res) => res.render('perfil', { title: "Perfil" }));

// Rotas da API
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/criancas", require("./routes/criancaRoutes"));
app.use("/api/associar", require("./routes/associacaoRoutes"));
app.use("/api/agenda", require("./routes/agendaRoutes"));
app.use("/api/info-crianca", require("./routes/infoCriancaRoutes"));

// Banco de dados
sequelize.sync({ alter: false })
  .then(() => console.log("✅ Banco conectado!"))
  .catch(err => {
    console.error("❌ Erro banco:", err);
    process.exit(1);
  });

// Middleware global de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "❌ Algo deu errado!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));