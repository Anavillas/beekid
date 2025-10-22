// middlewares/validacaoCpfLocalMiddleware.js

exports.validarCpf = (req, res, next) => {
  const { cpf } = req.body;

  if (!cpf) {
    return res.status(400).json({ error: 'O CPF é obrigatório.' });
  }

  const cpfLimpo = cpf.replace(/[^\d]+/g, '');

  // Checa se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }

  // Checa se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }

  let soma = 0;
  let resto;

  // Validação do primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }

  soma = 0;
  // Validação do segundo dígito verificador
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }

  next();
};