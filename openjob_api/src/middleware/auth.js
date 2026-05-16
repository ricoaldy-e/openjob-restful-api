const TokenManager = require('../tokenize/TokenManager');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'failed',
        message: 'Authentication token is required',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = TokenManager.verifyAccessToken(token);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'failed',
      message: 'Invalid or expired access token',
    });
  }
};

module.exports = authMiddleware;
