module.exports = (sequelize, DataTypes) => {
  const Crianca = sequelize.define('Crianca', {
    idCrianca:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome:            { type: DataTypes.STRING, allowNull: false },
    cpf:             { type: DataTypes.STRING, allowNull: true, unique: true },
    dataNascimento:  { type: DataTypes.DATE,  allowNull: true }
  }, {
    tableName: 'crianca',
    timestamps: false
  });

  Crianca.associate = (models) => {
    Crianca.belongsToMany(models.User, {
      through: models.AssociacaoResponsavelCrianca,
      foreignKey: 'id_crianca',
      otherKey: 'id_responsavel',
      as: 'responsaveis',
    });

    Crianca.belongsToMany(models.User, {
      through: models.AssociacaoCuidadorCrianca,
      foreignKey: 'id_crianca',
      otherKey: 'id_cuidador',
      as: 'cuidadores',
    });
  };

  return Crianca;
};
