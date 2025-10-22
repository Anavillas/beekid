module.exports = (sequelize, DataTypes) => {
  const AssociacaoResponsavelCrianca = sequelize.define('AssociacaoResponsavelCrianca', {
    idAssociacao:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_responsavel:{ type: DataTypes.INTEGER, allowNull: false },
    id_crianca:    { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'associacao_responsavel_crianca',
    timestamps: false
  });

  AssociacaoResponsavelCrianca.associate = (models) => {
    AssociacaoResponsavelCrianca.belongsTo(models.Crianca, {
      foreignKey: 'id_crianca',
      as: 'crianca',
    });
    AssociacaoResponsavelCrianca.belongsTo(models.User, {
      foreignKey: 'id_responsavel',
      as: 'responsavel',
    });
  };

  return AssociacaoResponsavelCrianca;
};
