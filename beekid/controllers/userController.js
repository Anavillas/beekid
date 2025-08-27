const jwt = require("jsonwebtoken");
const { segredo, expiresIn } = require("../config/jwt");
const bcrypt = require('bcrypt');
const { User, Crianca, AssociacaoResponsavelCrianca } = require('../models');

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
    const { nome, email, senha, tipoUser, telefone, cpf } = req.body;

    const existente = await User.findOne({ where: { email } });
    if (existente) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    const usuario = await User.create({ nome, email, senha, tipoUser, telefone, cpf });

    return res.status(201).json({
      usuario: {
        nome: usuario.nome,
        email: usuario.email,
        tipoUser: usuario.tipoUser,
        telefone: usuario.telefone,
        cpf: usuario.cpf
        // senha não precisa ser retornada por segurança
      },
      token: gerarToken(usuario)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro no registro", details: err });
  }
},


  async updateUser(req, res) {
    const { idUser } = req.params;
    const { nome, cpf, telefone, tipoUser, email, senha } = req.body;

    try {
      const atualizado = await User.update(
        { nome, cpf, telefone, tipoUser, email, senha },
        { where: { idUser } }
      );

      if (atualizado[0] === 0) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      res.json({ message: "Usuário atualizado com sucesso." });
    } catch (err) {
      res.status(500).json({ error: "Erro ao atualizar usuário", details: err });
    }
  },

  async deleteUser(req, res) {
    const { idUser } = req.params;

    try {
      const deletado = await User.destroy({ where: { idUser } });

      if (!deletado) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      res.json({ message: "Usuário deletado com sucesso." });
    } catch (err) {
      res.status(500).json({ error: "Erro ao deletar usuário", details: err });
    }
  }
  
};
