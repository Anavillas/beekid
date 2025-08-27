// controllers/associacaoController.js
const { User, AssociacaoCuidadorCrianca, AssociacaoResponsavelCrianca, Crianca } = require('../models');

// ... suas outras funções ...

exports.associarCuidador = async (req, res) => {
    try {
        const { emailCuidador, idCrianca } = req.body;
        const idResponsavel = req.user.idUser; // ID do usuário logado

        // Verificação de segurança: Confirma que o usuário logado é o responsável pela criança
        const isResponsavel = await AssociacaoResponsavelCrianca.findOne({
            where: { id_responsavel: idResponsavel, id_crianca: idCrianca }
        });
        if (!isResponsavel) {
            return res.status(403).json({ message: "Acesso negado. Você não é o responsável por esta criança." });
        }

        // Busca o ID do cuidador pelo e-mail
        const cuidador = await User.findOne({ where: { email: emailCuidador } });
        if (!cuidador) {
            return res.status(404).json({ message: "Usuário cuidador não encontrado." });
        }

        // Cria a associação no banco de dados
        await AssociacaoCuidadorCrianca.create({
            id_cuidador: cuidador.idUser,
            id_crianca: idCrianca
        });

        // Lógica para enviar e-mail de confirmação ao cuidador pode ser adicionada aqui
        // Exemplo: enviarEmail(emailCuidador, "Você foi associado a uma criança!");

        res.status(200).json({ message: "Cuidador associado com sucesso! Um e-mail de confirmação foi enviado." });

    } catch (error) {
        console.error("Erro ao associar cuidador:", error);
        res.status(500).json({ message: "Ocorreu um erro interno ao tentar associar o cuidador." });
    }
};

// ... não esqueça de exportar a nova função
module.exports = {
    // ... suas outras funções
    associarCuidador
};