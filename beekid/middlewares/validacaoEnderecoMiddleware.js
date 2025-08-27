// middlewares/validacaoEnderecoMiddleware.js

const axios = require('axios');

exports.validarEndereco = async (req, res, next) => {
  const { endereco } = req.body;
  
  if (!endereco || !endereco.cep) {
    return res.status(400).json({ error: 'O CEP é obrigatório para a validação do endereço.' });
  }

  try {
    const cep = endereco.cep.replace('-', '');
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    
    if (response.data.erro) {
      return res.status(400).json({ error: 'CEP não encontrado ou inválido.' });
    }
    
    // Anexa os dados do endereço à requisição
    req.body.endereco.logradouro = response.data.logradouro;
    req.body.endereco.bairro = response.data.bairro;
    req.body.endereco.localidade = response.data.localidade;
    req.body.endereco.uf = response.data.uf;
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao validar o CEP.', details: error.message });
  }
};