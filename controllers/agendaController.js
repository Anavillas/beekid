// controllers/agendaController.js
const { Agenda, Crianca } = require('../models');

module.exports = {
  async create(req, res) {
    try {
      let { horario, titulo, titulo_tarefa, descricao, status_tarefa, id_crianca } = req.body;

      // compat: se vier titulo_tarefa do cliente antigo
      if (!titulo && titulo_tarefa) titulo = titulo_tarefa;

      // normaliza status
      if (status_tarefa) status_tarefa = String(status_tarefa).toLowerCase();

      const novaTarefa = await Agenda.create({ horario, titulo, descricao, status_tarefa, id_crianca });
      return res.status(201).json(novaTarefa);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao criar tarefa na agenda", details: err?.message });
    }
  },

  async getAll(req, res) {
    try {
      const tarefas = await Agenda.findAll({
        include: [{ model: Crianca, as: 'crianca', attributes: ['nome'] }]
      });
      return res.json(tarefas);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar tarefas da agenda", details: err?.message });
    }
  },

  async getById(req, res) {
    const { idAgenda } = req.params;
    try {
      const tarefa = await Agenda.findByPk(idAgenda);
      if (!tarefa) return res.status(404).json({ error: "Tarefa não encontrada." });
      return res.json(tarefa);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar tarefa", details: err?.message });
    }
  },

  async getByCrianca(req, res) {
    const { id_crianca } = req.params;
    try {
      const tarefas = await Agenda.findAll({
        where: { id_crianca },
        include: [{ model: Crianca, as: 'crianca', attributes: ['nome'] }]
      });
      if (!tarefas || tarefas.length === 0) {
        return res.status(404).json({ error: "Nenhuma tarefa encontrada para esta criança." });
      }
      return res.json(tarefas);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar tarefas", details: err?.message });
    }
  },

  async update(req, res) {
    const { idAgenda } = req.params;
    let { horario, titulo, titulo_tarefa, descricao, status_tarefa } = req.body;

    if (!titulo && titulo_tarefa) titulo = titulo_tarefa;
    if (status_tarefa) status_tarefa = String(status_tarefa).toLowerCase();

    try {
      const [updated] = await Agenda.update(
        { horario, titulo, descricao, status_tarefa },
        { where: { idAgenda } }
      );
      if (updated === 0) return res.status(404).json({ error: "Tarefa não encontrada." });
      return res.json({ message: "Tarefa atualizada com sucesso." });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao atualizar tarefa", details: err?.message });
    }
  },

  async delete(req, res) {
    const { idAgenda } = req.params;
    try {
      const deleted = await Agenda.destroy({ where: { idAgenda } });
      if (!deleted) return res.status(404).json({ error: "Tarefa não encontrada." });
      return res.json({ message: "Tarefa deletada com sucesso." });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao deletar tarefa", details: err?.message });
    }
  }
};
