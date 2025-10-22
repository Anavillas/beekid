// middlewares/checkAuthenticatedHybridApi.js
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // opcional, só se quiser carregar mais campos

module.exports = async function checkAuthenticatedHybridApi(req, res, next) {
  try {
    // 1) Sessão do Passport?
    if (req.isAuthenticated && req.isAuthenticated()) return next();

    // 2) Busca token: ?token= -> Authorization: Bearer -> cookie
    let token = null;
    if (req.query && req.query.token) token = req.query.token;

    if (!token) {
      const auth = req.headers['authorization'];
      if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1];
    }

    if (!token && req.cookies && req.cookies.token) token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'não autenticado' });
    }

    // 3) Valida token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // 4) Normaliza o id (id | idUser | sub)
    const userId = decoded.idUser || decoded.id || decoded.sub;
    if (!userId) {
      return res.status(401).json({ error: 'token sem id' });
    }

    // 5) Anexa um req.user mínimo (o suficiente para as rotas)
    //    Se você precisar de tipoUser garantido, descomente o findByPk.
    // const user = await User.findByPk(userId);
    // if (!user) return res.status(401).json({ error: 'usuário não encontrado' });
    // req.user = user;

    req.user = {
      idUser: userId,
      email: decoded.email,
      nome: decoded.nome,
      tipoUser: decoded.tipoUser, // vai existir se você incluir no token
    };

    return next();
  } catch (e) {
    console.error('checkAuthenticatedHybridApi:', e);
    return res.status(401).json({ error: 'token inválido ou expirado' });
  }
};
