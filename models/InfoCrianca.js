module.exports = (sequelize, DataTypes) => {
  const InfoCrianca = sequelize.define("InfoCrianca", {
    idInfo_crianca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tipo_info: {
      type: DataTypes.ENUM('alergias','medicamento','outros'),
      allowNull: false
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data_registro: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    id_crianca: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Crianca', // Nome da tabela
        key: 'idCrianca'
      }
    }
  }, {
    tableName: 'info_crianca',
    timestamps: false
  });

  InfoCrianca.associate = (models) => {
    InfoCrianca.belongsTo(models.Crianca, {
      foreignKey: 'id_crianca',
      as: 'crianca'
    });
  };

  return InfoCrianca;
};