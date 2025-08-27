const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Carrega todos os modelos
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Crianca = require('./Crianca')(sequelize, Sequelize.DataTypes);
db.AssociacaoResponsavelCrianca = require('./AssociacaoResponsavelCrianca')(sequelize, Sequelize.DataTypes);
db.AssociacaoCuidadorCrianca = require('./associacaoCuidadorCrianca')(sequelize, Sequelize.DataTypes);
db.Agenda = require('./Agenda')(sequelize, Sequelize.DataTypes);
db.InfoCrianca = require('./InfoCrianca')(sequelize, Sequelize.DataTypes);

// Definindo associações
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;