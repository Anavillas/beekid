const jwt = require('jsonwebtoken');

function extractToken(req) {
  if (req.query?.token) return req.query.token;
  const auth = req.headers.authorization || req.get('authorization');
  if (auth) { const [s,t] = auth.split(' '); if (/^bearer$/i.test(s) && t) return t; }
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

module.exports = function hydrateUserFromToken(req, res, next) {
  try {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    const token = extractToken(req);
    if (!token) return next();
    const d = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const idUser = d.idUser || d.id || d.sub;
    if (!idUser) return next();

    req.user = Object.assign({}, req.user, { idUser, email: d.email, nome: d.nome, cpf: d.cpf });
    res.locals.nomeUsuario = res.locals.nomeUsuario || d.nome || d.email || '';
    res.locals.cpfUsuario  = res.locals.cpfUsuario  || d.cpf  || '';
    next();
  } catch { next(); }
};
