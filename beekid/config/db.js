require('dotenv').config();  // Carrega as variáveis de ambiente

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,      // Nome do banco de dados
  process.env.DB_USER,      // Usuário
  process.env.DB_PASS,      // Senha
  {
    host: process.env.DB_HOST,  // Host do banco de dados
    dialect: 'mysql',           // Tipo de banco de dados
  }
);

module.exports = sequelize;