// models/InfoCrianca.js
module.exports = (sequelize, DataTypes) => {
  const InfoCrianca = sequelize.define("InfoCrianca", {
    idInfo_crianca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tipo_info: {
      // alinhar com o ENUM do banco: 'ALERGIA','SAUDE','ESCOLA','OUTROS'
      type: DataTypes.ENUM('ALERGIA', 'SAUDE', 'ESCOLA', 'OUTROS'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['ALERGIA', 'SAUDE', 'ESCOLA', 'OUTROS']],
          msg: 'tipo_info deve ser ALERGIA | SAUDE | ESCOLA | OUTROS'
        }
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data_registro: {
      type: DataTypes.DATE,
      allowNull: false,
      // opcional: se quiser que o default venha do DB exatamente como na tabela:
      // defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      defaultValue: DataTypes.NOW
    },
    id_crianca: {
      type: DataTypes.INTEGER,
      references: {
        // Em Sequelize, 'model' aqui deve ser o nome da TABELA ou o próprio model.
        // Sua FK aponta para a tabela 'crianca' (coluna 'idCrianca').
        model: 'crianca',
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
