// routes/cuidadores.js
const express = require('express');
const router = express.Router();
const checkAuthenticatedHybridApi = require('../middlewares/checkAuthenticatedHybrid');
const { User, Crianca, Endereco } = require('../models');

// TODAS as rotas exigem auth (sessão OU JWT)
router.use(checkAuthenticatedHybridApi);

// aceita sessão OU JWT (req.user preenchido)
function ensureAuth(req, res, next) {
  if ((req.isAuthenticated && req.isAuthenticated()) || req.user) return next();
  return res.status(401).json({ error: 'não autenticado' });
}

/**
 * GET /cuidadores
 * Lista cuidadores vinculados a QUALQUER criança do responsável logado
 * (sem usar tipoUser; a elegibilidade vem da associação N:N)
 */
router.get('/', ensureAuth, async (req, res) => {
  try {
    const idResponsavel = req.user.idUser;

    const cuidadores = await User.findAll({
      // 🔸 NÃO filtramos por tipoUser aqui
      attributes: ['idUser','nome','foto','telefone','email'],
      include: [{
        model: Crianca,
        as: 'criancasComoCuidador',    // user ↔ (como cuidador) ↔ crianca
        attributes: [],
        required: true,                // precisa ter vínculo como cuidador
        through: { attributes: [] },
        include: [{
          model: User,
          as: 'responsaveis',          // essa criança precisa ter o responsável logado
          attributes: [],
          required: true,
          through: { attributes: [] },
          where: { idUser: idResponsavel }
        }]
      }],
      distinct: true,
      subQuery: false
    });

    const cards = cuidadores.map(c => ({
      id: c.idUser,
      nome: c.nome,
      fotoUrl: c.foto || null,
      telefone: c.telefone || null,
      email: c.email || null
    }));

    return res.json(cards);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'erro ao listar cuidadores' });
  }
});

/**
 * GET /cuidadores/:id
 * Perfil do cuidador, apenas se ele estiver vinculado como cuidador
 * a alguma criança do responsável logado (sem tipoUser)
 */
router.get('/:id', ensureAuth, async (req, res) => {
  try {
    const idResponsavel = req.user.idUser;
    const idCuidador = Number(req.params.id);
    if (!Number.isInteger(idCuidador)) {
      return res.status(400).json({ error: 'id inválido' });
    }

    const cuidador = await User.findOne({
      // 🔸 filtra o usuário solicitado (independente de tipoUser)
      where: { idUser: idCuidador },
      attributes: ['idUser','nome','foto','telefone','email','cpf'],
      include: [
        {
          model: Crianca,
          as: 'criancasComoCuidador',
          attributes: ['idCrianca','nome','dataNascimento'],
          required: true,              // precisa estar vinculado como cuidador…
          through: { attributes: [] },
          include: [{
            model: User,
            as: 'responsaveis',
            attributes: [],
            required: true,            // …de uma criança do responsável logado
            through: { attributes: [] },
            where: { idUser: idResponsavel }
          }]
        },
        { model: Endereco, as: 'enderecos', attributes: ['idEndereco','logradouro','numero','bairro','cidade','estado','cep'] }
      ]
    });

    if (!cuidador) {
      return res.status(404).json({ error: 'cuidador não encontrado ou sem vínculo com suas crianças' });
    }

    const perfil = {
      id: cuidador.idUser,
      nome: cuidador.nome,
      fotoUrl: cuidador.foto || null,
      telefone: cuidador.telefone || null,
      email: cuidador.email || null,
      cpf: cuidador.cpf || null,
      enderecos: (cuidador.enderecos || []).map(e => ({
        id: e.idEndereco,
        logradouro: e.logradouro,
        numero: e.numero,
        bairro: e.bairro,
        cidade: e.cidade,
        estado: e.estado,
        cep: e.cep
      })),
      criancasVinculadas: (cuidador.criancasComoCuidador || []).map(ch => ({
        id: ch.idCrianca,
        nome: ch.nome,
        dataNascimento: ch.dataNascimento
      }))
    };

    return res.json(perfil);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'erro ao carregar perfil do cuidador' });
  }
});

module.exports = router;
