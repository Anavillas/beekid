const { Agenda, Crianca } = require('../models');

module.exports = {
  // Criar uma nova tarefa na agenda
  async create(req, res) {
    try {
      const { horario, titulo, descricao, status_tarefa, id_crianca } = req.body;
      const novaTarefa = await Agenda.create({
        horario,
        titulo,
        descricao,
        status_tarefa,
        id_crianca
      });
      return res.status(201).json(novaTarefa);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao criar tarefa na agenda", details: err });
    }
  },

  // Listar todas as tarefas da agenda
  async getAll(req, res) {
    try {
      const tarefas = await Agenda.findAll({
        include: [{
          model: Crianca,
          as: 'crianca',
          attributes: ['nome']
        }]
      });
      return res.json(tarefas);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar tarefas da agenda", details: err });
    }
  },
  
  // Buscar tarefas de uma criança específica
  async getByCrianca(req, res) {
    const { id_crianca } = req.params;
    try {
      const tarefas = await Agenda.findAll({
        where: { id_crianca },
        include: [{
          model: Crianca,
          as: 'crianca',
          attributes: ['nome']
        }]
      });
      if (tarefas.length === 0) {
        return res.status(404).json({ error: "Nenhuma tarefa encontrada para esta criança." });
      }
      return res.json(tarefas);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar tarefas", details: err });
    }
  },

  // Atualizar uma tarefa da agenda
  async update(req, res) {
    const { idAgenda } = req.params;
    const { horario, titulo, descricao, status_tarefa } = req.body;
    try {
      const [updated] = await Agenda.update({ horario, titulo, descricao, status_tarefa }, {
        where: { idAgenda }
      });
      if (updated === 0) {
        return res.status(404).json({ error: "Tarefa não encontrada." });
      }
      res.json({ message: "Tarefa atualizada com sucesso." });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao atualizar tarefa", details: err });
    }
  },

  // Deletar uma tarefa da agenda
  async delete(req, res) {
    const { idAgenda } = req.params;
    try {
      const deleted = await Agenda.destroy({
        where: { idAgenda }
      });
      if (!deleted) {
        return res.status(404).json({ error: "Tarefa não encontrada." });
      }
      res.json({ message: "Tarefa deletada com sucesso." });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao deletar tarefa", details: err });
    }
  }
};