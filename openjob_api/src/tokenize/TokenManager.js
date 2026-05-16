const jwt = require('jsonwebtoken');

const TokenManager = {
  generateAccessToken(payload) {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, { expiresIn: '3h' });
  },

  generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_KEY);
  },

  verifyAccessToken(token) {
    return jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
  },

  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.REFRESH_TOKEN_KEY);
  },
};

module.exports = TokenManager;
