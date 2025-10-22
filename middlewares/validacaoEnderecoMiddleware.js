const axios = require('axios');

exports.validarEndereco = async (req, res, next) => {
  try {
    const src = req.body?.endereco || req.body || {};
    console.log('[ENDERECO][MIDDLEWARE] body recebido:', src);

    const cepRaw = (src.cep || '').toString().trim();
    if (!cepRaw) return res.status(400).json({ error: 'O CEP é obrigatório para a validação do endereço.' });

    const cep = cepRaw.replace(/\D/g, '');
    if (cep.length !== 8) return res.status(400).json({ error: 'CEP inválido. Use 8 dígitos (ex.: 01001000).' });

    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`, { timeout: 8000 });
    console.log('[ENDERECO][MIDDLEWARE] viaCEP ->', response.data);

    if (response.data?.erro) {
      return res.status(400).json({ error: 'CEP não encontrado ou inválido.' });
    }

    const via = response.data || {};
    req.validatedEndereco = {
      logradouro: via.logradouro || src.logradouro || '',
      bairro: via.bairro || src.bairro || '',
      cidade: via.localidade || src.cidade || '',
      estado: (via.uf || src.estado || '').toUpperCase(),
      cep: `${cep.slice(0,5)}-${cep.slice(5)}`,
      numero: src.numero || '',
      complemento: src.complemento || '',
    };
    console.log('[ENDERECO][MIDDLEWARE] validated:', req.validatedEndereco);
    next();
  } catch (error) {
    console.error('[ENDERECO][MIDDLEWARE] erro:', error);
    return res.status(500).json({ error: 'Erro ao validar o CEP.', details: error.message });
  }
};
