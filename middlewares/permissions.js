// middlewares/permissions.js
const { AssociacaoResponsavelCrianca, AssociacaoCuidadorCrianca, Agenda, InfoCrianca } = require('../models');

async function isResponsavel(idUser, idCrianca) {
  if (!idUser || !idCrianca) return false;
  const ok = await AssociacaoResponsavelCrianca.findOne({ where: { id_responsavel: idUser, id_crianca: idCrianca }});
  return !!ok;
}

async function isCuidador(idUser, idCrianca) {
  if (!idUser || !idCrianca) return false;
  const ok = await AssociacaoCuidadorCrianca.findOne({ where: { id_cuidador: idUser, id_crianca: idCrianca }});
  return !!ok;
}

async function canView(idUser, idCrianca) {
  return (await isResponsavel(idUser, idCrianca)) || (await isCuidador(idUser, idCrianca));
}

function requireAuth(req, res) {
  const idUser = req.user?.idUser;
  if (!idUser) {
    res.status(401).json({ message: 'Não autenticado' });
    return null;
  }
  return idUser;
}

// --------- Guards genéricos por criança ----------
exports.ensureCanViewCrianca = async (req, res, next) => {
  const idUser = requireAuth(req, res);
  if (!idUser) return;

  // aceita :id_crianca ou :idCrianca
  const idCrianca = req.params.id_crianca || req.params.idCrianca || req.body.id_crianca || req.body.idCrianca;
  if (!idCrianca) return res.status(400).json({ message: 'id_crianca é obrigatório' });

  if (await canView(idUser, idCrianca)) return next();
  return res.status(403).json({ message: 'Acesso negado' });
};

exports.ensureCanEditCrianca = async (req, res, next) => {
  const idUser = requireAuth(req, res);
  if (!idUser) return;

  const idCrianca = req.params.id_crianca || req.params.idCrianca || req.body.id_crianca || req.body.idCrianca;
  if (!idCrianca) return res.status(400).json({ message: 'id_crianca é obrigatório' });

  if (await isResponsavel(idUser, idCrianca)) return next();
  return res.status(403).json({ message: 'Apenas o responsável pode alterar dados' });
};

// --------- Guards por recurso (Agenda / Info) ----------
// Carregam o recurso para descobrir a criança e checar permissão

exports.ensureCanViewAgenda = async (req, res, next) => {
  const idUser = requireAuth(req, res);
  if (!idUser) return;

  const { idAgenda } = req.params;
  const item = await Agenda.findByPk(idAgenda);
  if (!item) return res.status(404).json({ message: 'Atividade não encontrada' });

  if (await canView(idUser, item.id_crianca)) return next();
  return res.status(403).json({ message: 'Acesso negado' });
};

exports.ensureCanEditAgenda = async (req, res, next) => {
  const idUser = requireAuth(req, res);
  if (!idUser) return;

  const { idAgenda } = req.params;
  const item = await Agenda.findByPk(idAgenda);
  if (!item) return res.status(404).json({ message: 'Atividade não encontrada' });

  if (await isResponsavel(idUser, item.id_crianca)) return next();
  return res.status(403).json({ message: 'Apenas o responsável pode alterar/excluir' });
};

exports.ensureCanViewInfo = async (req, res, next) => {
  const idUser = requireAuth(req, res);
  if (!idUser) return;

  const { idInfo_crianca } = req.params;
  const item = await InfoCrianca.findByPk(idInfo_crianca);
  if (!item) return res.status(404).json({ message: 'Informação não encontrada' });

  if (await canView(idUser, item.id_crianca)) return next();
  return res.status(403).json({ message: 'Acesso negado' });
};

exports.ensureCanEditInfo = async (req, res, next) => {
  const idUser = requireAuth(req, res);
  if (!idUser) return;

  const { idInfo_crianca } = req.params;
  const item = await InfoCrianca.findByPk(idInfo_crianca);
  if (!item) return res.status(404).json({ message: 'Informação não encontrada' });

  if (await isResponsavel(idUser, item.id_crianca)) return next();
  return res.status(403).json({ message: 'Apenas o responsável pode alterar/excluir' });
};
