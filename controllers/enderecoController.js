// controllers/enderecoController.js
const { Endereco } = require('../models');

module.exports = {
  async getAll(req, res) {
    try {
      const idUser = req.user?.idUser;
      if (!idUser) return res.status(401).json({ message: 'Não autenticado' });

      const enderecos = await Endereco.findAll({ where: { id_usuario: idUser } });
      res.json(enderecos);
    } catch (err) {
      console.error('[ENDERECO][GETALL] erro:', err);
      res.status(500).json({ error: 'Erro ao buscar endereços', details: err.message || err });
    }
  },

  async create(req, res) {
    try {
      const idUser = req.user?.idUser;
      if (!idUser) return res.status(401).json({ message: 'Não autenticado' });

      // Preferimos o endereço validado pelo middleware; se não houver, caímos pro body
      const src = req.validatedEndereco || req.body;
      console.log('[ENDERECO][CREATE] user:', idUser, 'payload:', src);

      const novo = await Endereco.create({
        id_usuario: idUser,
        logradouro: src.logradouro,
        numero: src.numero,
        complemento: src.complemento,
        bairro: src.bairro,
        cidade: src.cidade,
        estado: (src.estado || '').toUpperCase(),
        cep: src.cep
      });

      res.status(201).json(novo);
    } catch (err) {
      console.error('[ENDERECO][CREATE] erro:', err);
      res.status(500).json({ error: 'Erro ao criar endereço', details: err.message || err });
    }
  },

  async update(req, res) {
    try {
      const idUser = req.user?.idUser;
      if (!idUser) return res.status(401).json({ message: 'Não autenticado' });

      const { idEndereco } = req.params;
      const endereco = await Endereco.findByPk(idEndereco);
      if (!endereco) return res.status(404).json({ message: 'Endereço não encontrado' });
      if (endereco.id_usuario !== idUser) return res.status(403).json({ message: 'Acesso negado' });

      const src = req.validatedEndereco || req.body;

      await Endereco.update({
        logradouro: src.logradouro,
        numero: src.numero,
        complemento: src.complemento,
        bairro: src.bairro,
        cidade: src.cidade,
        estado: (src.estado || '').toUpperCase(),
        cep: src.cep
      }, { where: { idEndereco } });

      res.json({ message: 'Endereço atualizado com sucesso' });
    } catch (err) {
      console.error('[ENDERECO][UPDATE] erro:', err);
      res.status(500).json({ error: 'Erro ao atualizar endereço', details: err.message || err });
    }
  },

  async remove(req, res) {
    try {
      const idUser = req.user?.idUser;
      if (!idUser) return res.status(401).json({ message: 'Não autenticado' });

      const { idEndereco } = req.params;
      const endereco = await Endereco.findByPk(idEndereco);
      if (!endereco) return res.status(404).json({ message: 'Endereço não encontrado' });
      if (endereco.id_usuario !== idUser) return res.status(403).json({ message: 'Acesso negado' });

      await Endereco.destroy({ where: { idEndereco } });
      res.json({ message: 'Endereço removido com sucesso' });
    } catch (err) {
      console.error('[ENDERECO][REMOVE] erro:', err);
      res.status(500).json({ error: 'Erro ao deletar endereço', details: err.message || err });
    }
  }
};
