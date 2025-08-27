const { InfoCrianca, Crianca } = require('../models');

module.exports = {
  // Criar uma nova informação para a criança
  async create(req, res) {
    try {
      const { tipo_info, descricao, id_crianca } = req.body;
      const novaInfo = await InfoCrianca.create({
        tipo_info,
        descricao,
        id_crianca
      });
      return res.status(201).json(novaInfo);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao criar informação da criança", details: err });
    }
  },

  // Listar todas as informações
  async getAll(req, res) {
    try {
      const infos = await InfoCrianca.findAll({
        include: [{
          model: Crianca,
          as: 'crianca',
          attributes: ['nome']
        }]
      });
      return res.json(infos);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar informações", details: err });
    }
  },

  // Buscar informações de uma criança específica
  async getByCrianca(req, res) {
    const { id_crianca } = req.params;
    try {
      const infos = await InfoCrianca.findAll({
        where: { id_crianca },
        include: [{
          model: Crianca,
          as: 'crianca',
          attributes: ['nome']
        }]
      });
      if (infos.length === 0) {
        return res.status(404).json({ error: "Nenhuma informação encontrada para esta criança." });
      }
      return res.json(infos);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar informações", details: err });
    }
  },

  // Atualizar uma informação da criança
  async update(req, res) {
    const { idInfo_crianca } = req.params;
    const { tipo_info, descricao } = req.body;
    try {
      const [updated] = await InfoCrianca.update({ tipo_info, descricao }, {
        where: { idInfo_crianca }
      });
      if (updated === 0) {
        return res.status(404).json({ error: "Informação não encontrada." });
      }
      res.json({ message: "Informação atualizada com sucesso." });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao atualizar informação", details: err });
    }
  },

  // Deletar uma informação da criança
  async delete(req, res) {
    const { idInfo_crianca } = req.params;
    try {
      const deleted = await InfoCrianca.destroy({
        where: { idInfo_crianca }
      });
      if (!deleted) {
        return res.status(404).json({ error: "Informação não encontrada." });
      }
      res.json({ message: "Informação deletada com sucesso." });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao deletar informação", details: err });
    }
  }
};