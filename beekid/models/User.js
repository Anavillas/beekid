const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    idUser: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cpf: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    endereco: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tipoUser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    foto: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'User',
    timestamps: false,
  });

  User.beforeSave(async (user, options) => {
    // Garante que só criptografa a senha se ela for uma string e tiver sido alterada
    if (user.changed('senha') && typeof user.senha === 'string') {
      user.senha = await bcrypt.hash(user.senha, 10);
    }
  });

  // Associe todas as tabelas em um único bloco
  User.associate = (models) => {
    User.belongsToMany(models.Crianca, {
      through: models.AssociacaoResponsavelCrianca,
      foreignKey: 'id_responsavel',
      otherKey: 'id_crianca'
    });
    User.belongsToMany(models.Crianca, {
      through: models.AssociacaoCuidadorCrianca,
      foreignKey: 'id_cuidador',
      otherKey: 'id_crianca'
    });

  };

  return User;
};