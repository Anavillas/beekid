// models/Agenda.js
module.exports = (sequelize, DataTypes) => {
  const Agenda = sequelize.define("Agenda", {
    idAgenda: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    horario: { type: DataTypes.STRING, allowNull: false },
    titulo:  { type: DataTypes.STRING(150), allowNull: false }, // tabela permite 150
    descricao: { type: DataTypes.TEXT, allowNull: true },
    status_tarefa: {
      type: DataTypes.ENUM('PENDENTE', 'CONCLUIDO'),
      allowNull: true,                 // a tua tabela permite NULL
      defaultValue: 'PENDENTE',        // define default seguro (ver SQL abaixo)
      validate: {
        isIn: { args: [['PENDENTE','CONCLUIDO']], msg: 'status_tarefa inválido' }
      }
    },
    id_crianca: { type: DataTypes.INTEGER, references: { model: 'crianca', key: 'idCrianca' } }
  }, {
    tableName: 'agenda',
    timestamps: false
  });

  Agenda.associate = (models) => {
    Agenda.belongsTo(models.Crianca, { foreignKey: 'id_crianca', as: 'crianca' });
  };

  return Agenda;
};
