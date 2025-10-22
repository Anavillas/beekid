// controllers/authController.js
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { Op } = require('sequelize');

dotenv.config();

/** Gera o JWT com nomes de campos padronizados */
function gerarToken(user) {
  return jwt.sign(
    {
      id: user.idUser,        // <- padronizado como "id"
      email: user.email,
      tipoUser: user.tipoUser,
      nome: user.nome,
      cpf: user.cpf,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

/** Seta o cookie httpOnly de autenticação */
function setAuthCookie(res, token) {
  const oneDayMs = 1000 * 60 * 60 * 24;
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    // opcional: alinhe com o expiresIn. Se usar '1d' no JWT, use 1 dia aqui.
    maxAge: oneDayMs,
  });
}

// ========================
// Cadastro
// ========================
exports.register = async (req, res) => {
  try {
    const { nome, email, senha, telefone, cpf } = req.body;

    // Verifica duplicidade (email OU cpf já existentes)
    const existente = await User.findOne({
      where: { [Op.or]: [{ email }, { cpf }] }
    });
    if (existente) {
      return res.status(400).json({ error: 'E-mail ou CPF já cadastrados.' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    const user = await User.create({
      nome,
      email,
      senha: hashedPassword,
      telefone,
      cpf
    });

    const token = gerarToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token,
      user: {
        idUser: user.idUser,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        cpf: user.cpf,
        tipoUser: user.tipoUser,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao registrar o usuário', error });
  }
};

// ========================
// Login (por Email)
// ========================
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = gerarToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user: {
        idUser: user.idUser,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        cpf: user.cpf,
        tipoUser: user.tipoUser,
      },
    });
  } catch (error) {
    console.error('Erro ao realizar o login:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// ========================
// Login com Google (manual / fallback à estratégia do Passport)
// ========================
exports.googleLogin = async (req, res) => {
  try {
    const { googleId, email, nome, foto } = req.body;

    let user = await User.findOne({ where: { googleId } });
    if (!user) {
      user = await User.create({ nome, email, googleId, foto });
    }

    const token = gerarToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: 'Login com Google bem-sucedido!',
      token,
      user: {
        idUser: user.idUser,
        nome: user.nome,
        email: user.email,
        foto: user.foto,
        cpf: user.cpf,
        tipoUser: user.tipoUser,
      },
    });
  } catch (error) {
    console.error('Erro no login com Google:', error);
    return res.status(500).json({ message: 'Erro no login com Google', error });
  }
};
