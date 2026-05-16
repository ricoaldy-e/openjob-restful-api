const Joi = require('joi');

const ApplicationPayloadSchema = Joi.object({
  user_id: Joi.string().required(),
  job_id: Joi.string().required(),
  status: Joi.string().allow('', null).default('pending'),
});

const ApplicationStatusSchema = Joi.object({
  status: Joi.string().required(),
});

module.exports = { ApplicationPayloadSchema, ApplicationStatusSchema };
