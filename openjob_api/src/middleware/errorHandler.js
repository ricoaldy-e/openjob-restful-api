const ClientError = require('../exceptions/ClientError');

const errorHandler = (err, req, res, next) => {
  if (err instanceof ClientError) {
    return res.status(err.statusCode).json({
      status: 'failed',
      message: err.message,
    });
  }

  console.error(err);
  return res.status(500).json({
    status: 'failed',
    message: 'Internal server error',
  });
};

module.exports = errorHandler;
