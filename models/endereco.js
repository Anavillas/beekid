module.exports = (sequelize, DataTypes) => {
  const Endereco = sequelize.define('Endereco', {
    idEndereco: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: true },
    logradouro: { type: DataTypes.STRING },
    numero:     { type: DataTypes.STRING },
    complemento:{ type: DataTypes.STRING },
    bairro:     { type: DataTypes.STRING },
    cidade:     { type: DataTypes.STRING },
    estado:     { type: DataTypes.STRING(2) },
    cep:        { type: DataTypes.STRING(9) },
  }, {
    tableName: 'enderecos',
    timestamps: false,
  });

  Endereco.associate = (models) => {
    Endereco.belongsTo(models.User, {
      foreignKey: 'id_usuario',
      as: 'usuario'
    });
  };

  return Endereco;
};
