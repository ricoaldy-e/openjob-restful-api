const Joi = require('joi');

const LoginPayloadSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

const RefreshTokenPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const DeleteTokenPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { LoginPayloadSchema, RefreshTokenPayloadSchema, DeleteTokenPayloadSchema };
