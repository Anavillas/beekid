module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    idUser:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome:       { type: DataTypes.STRING,  allowNull: true  },
    cpf:        { type: DataTypes.STRING,  allowNull: true  },
    telefone:   { type: DataTypes.STRING,  allowNull: true  },
    tipoUser:   { type: DataTypes.ENUM('RESPONSAVEL','CUIDADOR'), allowNull: true },
    email:      { type: DataTypes.STRING,  allowNull: true, unique: true },
    senha:      { type: DataTypes.STRING,  allowNull: true  },
    googleId:   { type: DataTypes.STRING,  allowNull: true, unique: true },
    foto:       { type: DataTypes.STRING,  allowNull: true  },
  }, {
    tableName: 'user',
    timestamps: false,
  });

  User.associate = (models) => {
    User.belongsToMany(models.Crianca, {
      through: models.AssociacaoResponsavelCrianca,
      foreignKey: 'id_responsavel',
      otherKey: 'id_crianca',
      as: 'criancasComoResponsavel',
    });

    User.belongsToMany(models.Crianca, {
      through: models.AssociacaoCuidadorCrianca,
      foreignKey: 'id_cuidador',
      otherKey: 'id_crianca',
      as: 'criancasComoCuidador',
    });

    User.hasMany(models.Endereco, {
      foreignKey: 'id_usuario',
      as: 'enderecos',
    });
  };

  return User;
};
