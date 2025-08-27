require('dotenv').config();  // Carrega as variáveis de ambiente

module.exports = {
  segredo: process.env.JWT_SECRET || 'your-secret-key',  // Segredo do JWT
  expiresIn: process.env.JWT_EXPIRES_IN || '1d'         // Tempo de expiração do JWT
};