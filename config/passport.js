const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("../models"); // ajusta conforme sua estrutura Sequelize

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Converte profile.id para string
        const googleIdStr = profile.id.toString();

        // 1️⃣ Tenta encontrar usuário pelo googleId
        let user = await User.findOne({ where: { googleId: googleIdStr } });

        // 2️⃣ Se não existir, cria um novo usuário
        if (!user) {
          user = await User.create({
            googleId: googleIdStr,
            nome: profile.displayName,
            email: profile.emails[0].value,
            foto: profile.photos[0]?.value, // opcional
          });
        }

        // 3️⃣ Retorna o usuário encontrado ou criado
        return done(null, user);
      } catch (err) {
        console.error("Erro no Passport GoogleStrategy:", err);
        return done(err, null);
      }
    }
  )
);


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