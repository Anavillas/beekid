// models/Crianca.js
module.exports = (sequelize, DataTypes) => {
  const Crianca = sequelize.define("Crianca", {
    idCrianca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cpf: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    dataNascimento: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'Crianca',
    timestamps: false
  });
 
  Crianca.associate = (models) => {
    // Associação com o modelo User (como Responsável)
    Crianca.belongsToMany(models.User, {
      through: models.AssociacaoResponsavelCrianca,
      foreignKey: 'id_crianca',
      otherKey: 'id_responsavel',
      as: 'responsaveis' // Use um alias para evitar conflitos
    });
 
    // Associação com o modelo User (como Cuidador)
    Crianca.belongsToMany(models.User, {
      through: models.AssociacaoCuidadorCrianca,
      foreignKey: 'id_crianca',
      otherKey: 'id_cuidador',
      as: 'cuidadores' // Use um alias para evitar conflitos
    });

    // Correção nas associações reversas, que são necessárias para as consultas do controller
    models.AssociacaoResponsavelCrianca.belongsTo(models.Crianca, {
        foreignKey: 'id_crianca',
        as: 'crianca'
    });
    models.AssociacaoCuidadorCrianca.belongsTo(models.Crianca, {
        foreignKey: 'id_crianca',
        as: 'crianca'
    });
 };
 
  return Crianca;
};