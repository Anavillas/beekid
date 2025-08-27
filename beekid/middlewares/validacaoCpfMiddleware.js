// middlewares/validacaoCpfMiddleware.js

const axios = require('axios');

exports.validarCpf = async (req, res, next) => {
  const { cpf } = req.body;
  if (!cpf) {
    return res.status(400).json({ error: 'O CPF é obrigatório.' });
  }

  try {
    const cpfLimpo = cpf.replace(/[^\d]+/g, '');
    const response = await axios.get(`https://brasilapi.com.br/api/cpf/v1/${cpfLimpo}`);
    
    // A Brasil API retorna um status 400 se o CPF for inválido
    // A validação de sucesso continuará se a requisição for 200 OK
    if (response.status === 200) {
      next();
    } else {
      return res.status(400).json({ error: 'CPF inválido ou não encontrado.' });
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }
    return res.status(500).json({ error: 'Erro ao validar o CPF com a API.', details: error.message });
  }
};