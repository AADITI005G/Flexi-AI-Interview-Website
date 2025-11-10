const jwt = require('jsonwebtoken');

module.exports = function generateToken(id) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign({ id }, secret, { expiresIn: '7d' });
};