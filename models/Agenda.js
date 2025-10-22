// models/Agenda.js
module.exports = (sequelize, DataTypes) => {
  const Agenda = sequelize.define("Agenda", {
    idAgenda: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    horario: { type: DataTypes.STRING, allowNull: false },
    titulo:  { type: DataTypes.STRING(45), allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    status_tarefa: { type: DataTypes.ENUM('concluido', 'pendente'), defaultValue: 'pendente', allowNull: false },
    id_crianca: { type: DataTypes.INTEGER, references: { model: 'Crianca', key: 'idCrianca' } }
  }, {
    tableName: 'agenda',
    timestamps: false
  });

  Agenda.associate = (models) => {
    Agenda.belongsTo(models.Crianca, { foreignKey: 'id_crianca', as: 'crianca' });
  };

  return Agenda;
};
