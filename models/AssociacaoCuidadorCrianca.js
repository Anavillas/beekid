module.exports = (sequelize, DataTypes) => {
  const AssociacaoCuidadorCrianca = sequelize.define('AssociacaoCuidadorCrianca', {
    idAssociacao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_cuidador:  { type: DataTypes.INTEGER, allowNull: false },
    id_crianca:   { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'associacaocuidadorcrianca',
    timestamps: false
  });

  AssociacaoCuidadorCrianca.associate = (models) => {
    AssociacaoCuidadorCrianca.belongsTo(models.User, {
      as: 'cuidador',
      foreignKey: 'id_cuidador',
    });
    AssociacaoCuidadorCrianca.belongsTo(models.Crianca, {
      as: 'crianca',
      foreignKey: 'id_crianca',
    });
  };

  return AssociacaoCuidadorCrianca;
};
