const Joi = require('joi');

const JobPayloadSchema = Joi.object({
  company_id: Joi.string().required(),
  category_id: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  job_type: Joi.string().allow('', null),
  experience_level: Joi.string().allow('', null),
  location_type: Joi.string().allow('', null),
  location_city: Joi.string().allow('', null),
  salary_min: Joi.number().integer().allow(null),
  salary_max: Joi.number().integer().allow(null),
  is_salary_visible: Joi.boolean().allow(null),
  status: Joi.string().allow('', null),
});

module.exports = { JobPayloadSchema };
