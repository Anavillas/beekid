// models/index.js
const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.User                        = require('./User')(sequelize, Sequelize.DataTypes);
db.Crianca                     = require('./Crianca')(sequelize, Sequelize.DataTypes);
db.AssociacaoResponsavelCrianca= require('./AssociacaoResponsavelCrianca.js')(sequelize, Sequelize.DataTypes);
db.AssociacaoCuidadorCrianca   = require('./AssociacaoCuidadorCrianca.js')(sequelize, Sequelize.DataTypes);
db.Agenda                      = require('./Agenda')(sequelize, Sequelize.DataTypes);
db.InfoCrianca                 = require('./InfoCrianca')(sequelize, Sequelize.DataTypes);
db.Endereco                    = require('./endereco')(sequelize, Sequelize.DataTypes); // <--- AQUI

// Chama associate de todos (depois de TODOS estarem no objeto)
Object.keys(db).forEach(name => {
  if (db[name] && typeof db[name].associate === 'function') {
    db[name].associate(db);
  }
});

module.exports = db;
