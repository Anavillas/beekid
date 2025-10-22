// controllers/criancaController.js
const { Crianca, User, Endereco, AssociacaoResponsavelCrianca, AssociacaoCuidadorCrianca } = require('../models');

// Função para buscar uma única criança por ID
exports.getCriancaById = async (req, res) => {
    console.log("Requisição para getCriancaById recebida!");
    try {
        const idCrianca = req.params.idCrianca;
        const crianca = await Crianca.findByPk(idCrianca);

        if (!crianca) {
            return res.status(404).json({ message: "Criança não encontrada." });
        }

        res.status(200).json(crianca);
    } catch (error) {
        console.error("Erro ao buscar criança por ID:", error);
        res.status(500).json({ message: "❌ Algo deu errado ao buscar a criança!" });
    }
};

exports.getAllCriancasDoUsuario = async (req, res) => {
    try {
        const userId = req.user?.idUser;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        const [responsavelAssocs, cuidadorAssocs] = await Promise.all([
            AssociacaoResponsavelCrianca.findAll({
                where: { id_responsavel: userId },
                include: [{ model: Crianca, as: 'crianca' }]
            }),
            AssociacaoCuidadorCrianca.findAll({
                where: { id_cuidador: userId },
                include: [{ model: Crianca, as: 'crianca' }]
            })
        ]);

        const criancasMap = {};

        responsavelAssocs.forEach(assoc => {
            const crianca = assoc.crianca.toJSON();
            criancasMap[crianca.idCrianca] = { ...crianca, papelDoUsuario: 'responsavel' };
        });

        cuidadorAssocs.forEach(assoc => {
            const crianca = assoc.crianca.toJSON();
            if (criancasMap[crianca.idCrianca]) {
                criancasMap[crianca.idCrianca].papelDoUsuario = 'ambos';
            } else {
                criancasMap[crianca.idCrianca] = { ...crianca, papelDoUsuario: 'cuidador' };
            }
        });

        const criancasDoUsuario = Object.values(criancasMap);

        res.json(criancasDoUsuario);

    } catch (error) {
        console.error("Erro detalhado ao buscar crianças do usuário:", error.stack);
        res.status(500).json({ message: "Ocorreu um erro interno ao buscar as crianças." });
    }
};

exports.getAllCriancas = async (req, res) => {
    try {
        const criancas = await Crianca.findAll();
        res.json(criancas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar crianças" });
    }
};

exports.createCrianca = async (req, res) => {
    const { nome, cpf, dataNascimento } = req.body;
    const idResponsavel = req.user.idUser;

    if (!nome || !cpf || !dataNascimento) {
        return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    try {
        const novaCrianca = await Crianca.create({ nome, cpf, dataNascimento });
        const responsavel = await User.findOne({ 
            where: { idUser: idResponsavel } 
        });

        if (!responsavel) {
            return res.status(404).json({ error: "Responsável não encontrado." });
        }

        await AssociacaoResponsavelCrianca.create({
            id_responsavel: idResponsavel,
            id_crianca: novaCrianca.idCrianca
        });

        return res.status(201).json({
            message: "Criança criada e associada ao responsável!",
            crianca: novaCrianca
        });
    } catch (err) {
        console.error("Detalhes do erro:", err);
        return res.status(500).json({ error: "Erro ao criar criança", details: err.message });
    }
};

exports.associarResponsavel = async (req, res) => {
    try {
        const { id_responsavel, id_crianca } = req.body;

        const associacao = await AssociacaoResponsavelCrianca.create({
            id_responsavel,
            id_crianca
        });

        res.status(201).json({ mensagem: 'Responsável associado com sucesso', associacao });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao associar responsável', detalhes: error.message });
    }
};


exports.updateCrianca = async (req, res) => {
    const { idCrianca } = req.params;
    const { nome, cpf, dataNascimento } = req.body;

    if (!nome || !cpf || !dataNascimento) {
        return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    try {
        const [atualizado] = await Crianca.update(
            { nome, cpf, dataNascimento },
            { where: { idCrianca } }
        );

        if (atualizado === 0) {
            return res.status(404).json({ error: "Criança não encontrada." });
        }

        res.status(200).json({ message: "Criança atualizada com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao atualizar criança" });
    }
};

exports.deleteCrianca = async (req, res) => {
    const { idCrianca } = req.params;

    try {
        const deletado = await Crianca.destroy({ where: { idCrianca } });

        if (!deletado) {
            return res.status(404).json({ error: "Criança não encontrada." });
        }

        res.status(200).json({ message: "Criança deletada com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao deletar criança" });
    }
};

// === LISTAR CUIDADORES DE UMA CRIANÇA ===
exports.getCuidadoresByCrianca = async (req, res) => {
  try {
    const { idCrianca } = req.params;

    const assocs = await AssociacaoCuidadorCrianca.findAll({
      where: { id_crianca: idCrianca },
      include: [{ model: User, as: 'cuidador', attributes: ['idUser', 'nome', 'email'] }]
    });

    // filtra associações sem join e mapeia
    const cuidadores = assocs
      .filter(a => a.cuidador)
      .map(a => ({
        idUser: a.cuidador.idUser,
        nome: a.cuidador.nome,
        email: a.cuidador.email
      }));

    // SEM 404 aqui: devolve [] para o front tratar
    return res.status(200).json(cuidadores);
  } catch (error) {
    console.error('Erro getCuidadoresByCrianca:', error);
    res.status(500).json({ message: 'Erro ao listar cuidadores.' });
  }
};

// === ASSOCIAR CUIDADOR (já existia, mas com proteções extras) ===
exports.associarCuidador = async (req, res) => {
  try {
    const { emailCuidador, idCrianca } = req.body;
    const idResponsavel = req.user.idUser;

    const isResponsavel = await AssociacaoResponsavelCrianca.findOne({
      where: { id_responsavel: idResponsavel, id_crianca: idCrianca }
    });
    if (!isResponsavel) {
      return res.status(403).json({ message: 'Acesso negado. Você não é o responsável por esta criança.' });
    }

    const cuidador = await User.findOne({ where: { email: emailCuidador } });
    if (!cuidador) return res.status(404).json({ message: 'Usuário cuidador não encontrado.' });

    // Evita duplicação
    const jaExiste = await AssociacaoCuidadorCrianca.findOne({
      where: { id_cuidador: cuidador.idUser, id_crianca: idCrianca }
    });
    if (jaExiste) return res.status(409).json({ message: 'Este cuidador já está associado a esta criança.' });

    await AssociacaoCuidadorCrianca.create({
      id_cuidador: cuidador.idUser,
      id_crianca: idCrianca
    });

    res.status(200).json({ message: 'Cuidador associado com sucesso!' });
  } catch (error) {
    console.error('Erro ao associar cuidador:', error);
    res.status(500).json({ message: 'Ocorreu um erro interno ao tentar associar o cuidador.' });
  }
};

// === DESASSOCIAR CUIDADOR (opcional, mas útil) ===
// controllers/criancaController.js
exports.desassociarCuidador = async (req, res) => {
  try {
    const { idCrianca, idCuidador } = req.params; // <-- nomes iguais aos da rota
    const idResponsavel = req.user.idUser;

    // Só o responsável pode desassociar:
    const isResponsavel = await AssociacaoResponsavelCrianca.findOne({
      where: { id_responsavel: idResponsavel, id_crianca: idCrianca }
    });
    if (!isResponsavel) {
      return res.status(403).json({ message: 'Acesso negado. Você não é o responsável por esta criança.' });
    }

    const deleted = await AssociacaoCuidadorCrianca.destroy({
      where: { id_cuidador: idCuidador, id_crianca: idCrianca }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Associação não encontrada.' });
    }

    return res.json({ message: 'Cuidador desassociado com sucesso.' });
  } catch (error) {
    console.error('Erro desassociarCuidador:', error);
    res.status(500).json({ message: 'Erro ao desassociar cuidador.' });
  }
};
exports.getCuidadoresFullByCrianca = async (req, res) => {
  try {
    const idUser = req.user?.idUser;
    const { idCrianca } = req.params;

    if (!idUser) return res.status(401).json({ message: 'Não autenticado' });
    if (!idCrianca) return res.status(400).json({ message: 'idCrianca é obrigatório' });

    // Somente o RESPONSÁVEL dessa criança pode ver dados completos dos cuidadores
    const isResp = await AssociacaoResponsavelCrianca.findOne({
      where: { id_responsavel: idUser, id_crianca: idCrianca }
    });
    if (!isResp) {
      return res.status(403).json({ message: 'Apenas o responsável pode visualizar os cuidadores desta criança.' });
    }

    const assocs = await AssociacaoCuidadorCrianca.findAll({
      where: { id_crianca: idCrianca },
      include: [{
        model: User,
        as: 'cuidador',
        attributes: ['idUser', 'nome', 'email', 'telefone', 'cpf', 'tipoUser', 'foto'],
        include: [{ model: Endereco, as: 'enderecos' }]
      }]
    });

    const cuidadores = assocs
      .filter(a => a.cuidador)
      .map(a => {
        const c = a.cuidador;
        return {
          idUser: c.idUser,
          nome: c.nome,
          email: c.email,
          telefone: c.telefone,
          cpf: c.cpf,
          tipoUser: c.tipoUser,
          foto: c.foto,
          enderecos: (c.enderecos || []).map(e => ({
            idEndereco: e.idEndereco,
            logradouro: e.logradouro,
            numero: e.numero,
            complemento: e.complemento,
            bairro: e.bairro,
            cidade: e.cidade,
            estado: e.estado,
            cep: e.cep
          }))
        };
      });

    return res.json(cuidadores); // sempre array
  } catch (error) {
    console.error('Erro getCuidadoresFullByCrianca:', error);
    res.status(500).json({ message: 'Erro ao listar cuidadores.' });
  }
};