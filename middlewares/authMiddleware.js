// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  let token = null;

  // 1) Authorization: Bearer <token> (maior prioridade em APIs)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2) ?token=... (primeiro acesso via redirect - priorize sobre cookie antigo)
  if (!token && req.query && req.query.token) {
    token = req.query.token;

    // Define cookie httpOnly para próximas navegações
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60, // 1h
    });

    // NÃO limpa a URL aqui; deixe o front decidir se quer remover a query
    // (ex.: window.history.replaceState(...) no cliente)
  }

  // 3) Cookie 'token' (fallback)
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    req.user = { idUser: decoded.id, email: decoded.email };
    res.locals.nomeUsuario = res.locals.nomeUsuario || decoded.nome || decoded.email || 'Usuário';
    res.locals.cpfUsuario  = res.locals.cpfUsuario  || decoded.cpf  || '';
    return next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido ou expirado' });
  }
};
