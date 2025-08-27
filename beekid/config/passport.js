const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("../models"); // ajusta conforme sua estrutura Sequelize

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Tenta encontrar um usuário com o Google ID
      let user = await User.findOne({ where: { googleId: profile.id } });

      // SE O USUÁRIO NÃO EXISTE, CRIE UM NOVO
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          nome: profile.displayName,
          email: profile.emails[0].value,
          // Outras informações que você queira salvar
        });
      }

      // Retorna o usuário encontrado ou recém-criado
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));


passport.serializeUser((user, done) => {
  done(null, user.idUser); // só salva o ID na sessão
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
