// controllers/userController.js
const jwt = require("jsonwebtoken");
const { segredo, expiresIn } = require("../config/jwt");
const bcrypt = require('bcrypt');
const { User } = require('../models');

function gerarToken(usuario) {
  return jwt.sign(
    { idUser: usuario.idUser, tipoUser: usuario.tipoUser },
    segredo,
    { expiresIn }
  );
}

module.exports = {
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({ attributes: { exclude: ['senha'] } });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar usuários", details: err });
    }
  },

  async register(req, res) {
    try {
      const { nome, email, senha, tipoUser, telefone, cpf } = req.body || {};

      const existente = await User.findOne({ where: { email } });
      if (existente) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      if (cpf) {
        const cpfExistente = await User.findOne({ where: { cpf } });
        if (cpfExistente) {
          return res.status(400).json({ error: "CPF já cadastrado" });
        }
      }

      const hash = senha ? await bcrypt.hash(senha, 10) : null;

      const usuario = await User.create({
        nome, email, senha: hash, tipoUser, telefone, cpf
      });

      return res.status(201).json({
        usuario: {
          idUser: usuario.idUser,
          nome: usuario.nome,
          email: usuario.email,
          tipoUser: usuario.tipoUser,
          telefone: usuario.telefone,
          cpf: usuario.cpf
        },
        token: gerarToken(usuario)
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro no registro", details: err.message || err });
    }
  },

  async login(req, res) {
    const { cpf, senha } = req.body || {};
    try {
      const user = await User.findOne({ where: { cpf } });
      if (!user || !(await bcrypt.compare(senha || '', user.senha || ''))) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
      }
      const token = gerarToken(user);
      res.status(200).json({ message: 'Login bem-sucedido!', token });
    } catch (error) {
      console.error('Erro ao realizar o login:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  // ====== pegar dados do usuário logado ======
  async getMe(req, res) {
    try {
      const idUser = req.user?.idUser;
      if (!idUser) return res.status(401).json({ message: 'Não autenticado' });

      const me = await User.findByPk(idUser, {
        attributes: { exclude: ['senha'] }
      });
      if (!me) return res.status(404).json({ message: 'Usuário não encontrado' });

      res.json(me);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao carregar perfil', details: err.message || err });
    }
  },

  // ====== atualizar dados do usuário logado ======
  async updateMe(req, res) {
    try {
      const idUser = req.user?.idUser;
      if (!idUser) return res.status(401).json({ message: 'Não autenticado' });

      const body = req.body || {};
      const patch = {};

      if (typeof body.nome === 'string') patch.nome = body.nome.trim();
      if (typeof body.telefone === 'string') patch.telefone = body.telefone.trim();
      if (typeof body.senha === 'string' && body.senha.trim()) {
        const nova = body.senha.trim();
        if (nova.length < 6) {
          return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' });
        }
        patch.senha = await bcrypt.hash(nova, 10);
      }

      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ message: 'Nada para atualizar' });
      }

      const [n] = await User.update(patch, { where: { idUser } });
      if (n === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

      res.json({ message: 'Perfil atualizado com sucesso' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar perfil', details: err.message || err });
    }
  },

  async updateUser(req, res) {
    const { idUser } = req.params || {};
    const body = req.body || {};

    try {
      const patch = {};
      if (typeof body.nome === 'string') patch.nome = body.nome;
      if (typeof body.cpf === 'string') patch.cpf = body.cpf;
      if (typeof body.telefone === 'string') patch.telefone = body.telefone;
      if (typeof body.tipoUser === 'string') patch.tipoUser = body.tipoUser;
      if (typeof body.email === 'string') patch.email = body.email;

      if (typeof body.senha === 'string' && body.senha.trim()) {
        const nova = body.senha.trim();
        if (nova.length < 6) {
          return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' });
        }
        patch.senha = await bcrypt.hash(nova, 10);
      }

      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ error: 'Nada para atualizar' });
      }

      const [n] = await User.update(patch, { where: { idUser } });

      if (n === 0) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      res.json({ message: "Usuário atualizado com sucesso." });
    } catch (err) {
      res.status(500).json({ error: "Erro ao atualizar usuário", details: err.message || err });
    }
  },

  async deleteUser(req, res) {
    const { idUser } = req.params || {};
    try {
      const deletado = await User.destroy({ where: { idUser } });
      if (!deletado) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      res.json({ message: "Usuário deletado com sucesso." });
    } catch (err) {
      res.status(500).json({ error: "Erro ao deletar usuário", details: err.message || err });
    }
  }
};
