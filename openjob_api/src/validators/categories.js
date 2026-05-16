const Joi = require('joi');

const CategoryPayloadSchema = Joi.object({
  name: Joi.string().min(1).required(),
});

module.exports = { CategoryPayloadSchema };
