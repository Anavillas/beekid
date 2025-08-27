// controllers/authController.js
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

// Função de registro
exports.register = async (req, res) => {
  const { nome, email, senha, tipoUser, endereco, telefone, cpf } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    const user = await User.create({
      nome,
      email,
      senha: hashedPassword,
      tipoUser,
      endereco,
      telefone,
      cpf
    });

    const token = jwt.sign(
      { id: user.idUser, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token,
      user: {
        nome: user.nome,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar o usuário', error });
  }
};

// Função de login
exports.login = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const isValidPassword = await bcrypt.compare(senha, user.senha);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user.idUser, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao realizar o login', error });
  }
};

// Função de login com Google
exports.googleLogin = async (req, res) => {
  try {
    const { googleId, email, nome, foto } = req.body;

    let user = await User.findOne({ where: { googleId } });

    // Se não existir, cria
    if (!user) {
      user = await User.create({
        nome,
        email,
        googleId,
        foto
      });
    }

    const token = jwt.sign(
      { id: user.idUser, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.status(200).json({
      message: 'Login com Google bem-sucedido!',
      token,
      user: {
        nome: user.nome,
        email: user.email,
        foto: user.foto
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro no login com Google', error });
  }
};
