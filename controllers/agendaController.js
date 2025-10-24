const { Agenda, Crianca } = require('../models');

const MAP_STATUS = {
  PENDENTE: 'PENDENTE', CONCLUIDO: 'CONCLUIDO',
  CONCLUÍDO: 'CONCLUIDO', CONCLUIDA: 'CONCLUIDO', FEITO: 'CONCLUIDO', DONE: 'CONCLUIDO',
  PEND: 'PENDENTE', TODO: 'PENDENTE', ABERTO: 'PENDENTE', ABERTA: 'PENDENTE'
};
function normStatus(v) {
  if (!v) return null;
  const s = String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  return MAP_STATUS[s] || (s === 'PENDENTE' || s === 'CONCLUIDO' ? s : null);
}

module.exports = {
  async create(req, res) {
    try {
      let { horario, titulo, titulo_tarefa, descricao, status_tarefa, id_crianca } = req.body;
      if (!titulo && titulo_tarefa) titulo = titulo_tarefa;

      const status = normStatus(status_tarefa) || 'PENDENTE'; // default seguro

      const novaTarefa = await Agenda.create({ horario, titulo, descricao, status_tarefa: status, id_crianca });
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
    const status = status_tarefa ? normStatus(status_tarefa) : undefined;

    const data = { horario, titulo, descricao };
    if (status) data.status_tarefa = status;

    try {
      const [updated] = await Agenda.update(data, { where: { idAgenda } });
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
