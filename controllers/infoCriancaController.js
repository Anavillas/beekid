// controllers/infoCriancaController.js
const { InfoCrianca, Crianca } = require('../models');

const MAP_TIPO = {
  alergia: 'alergias',
  alergias: 'alergias',
  saude: 'medicamento',
  medicamento: 'medicamento',
  escola: 'outros',   // ajuste aqui se adicionar ENUM 'escola' no modelo
  outros: 'outros'
};
function normTipo(v) {
  if (!v) return null;
  const k = String(v).toLowerCase();
  return MAP_TIPO[k] || null;
}

module.exports = {
  async create(req, res) {
    try {
      const { tipo_info, descricao, id_crianca } = req.body;
      const tipo = normTipo(tipo_info);
      if (!tipo) return res.status(400).json({ error: "tipo_info inválido" });

      const novaInfo = await InfoCrianca.create({ tipo_info: tipo, descricao, id_crianca });
      return res.status(201).json(novaInfo);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao criar informação da criança", details: err?.message });
    }
  },

  async getAll(req, res) {
    try {
      const infos = await InfoCrianca.findAll({
        include: [{ model: Crianca, as: 'crianca', attributes: ['nome'] }]
      });
      return res.json(infos);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar informações", details: err?.message });
    }
  },

  async getByCrianca(req, res) {
    const { id_crianca } = req.params;
    try {
      const infos = await InfoCrianca.findAll({
        where: { id_crianca },
        include: [{ model: Crianca, as: 'crianca', attributes: ['nome'] }]
      });
      if (!infos || infos.length === 0) {
        return res.status(404).json({ error: "Nenhuma informação encontrada para esta criança." });
      }
      return res.json(infos);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar informações", details: err?.message });
    }
  },

  async update(req, res) {
    const { idInfo_crianca } = req.params;
    let { tipo_info, descricao } = req.body;
    try {
      const data = {};
      if (tipo_info) {
        const tipo = normTipo(tipo_info);
        if (!tipo) return res.status(400).json({ error: "tipo_info inválido" });
        data.tipo_info = tipo;
      }
      if (descricao != null) data.descricao = descricao;

      const [updated] = await InfoCrianca.update(data, { where: { idInfo_crianca } });
      if (updated === 0) return res.status(404).json({ error: "Informação não encontrada." });
      return res.json({ message: "Informação atualizada com sucesso." });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao atualizar informação", details: err?.message });
    }
  },

  async delete(req, res) {
    const { idInfo_crianca } = req.params;
    try {
      const deleted = await InfoCrianca.destroy({ where: { idInfo_crianca } });
      if (!deleted) return res.status(404).json({ error: "Informação não encontrada." });
      return res.json({ message: "Informação deletada com sucesso." });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao deletar informação", details: err?.message });
    }
  }
};
