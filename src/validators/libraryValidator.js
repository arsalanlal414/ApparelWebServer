import Joi from 'joi';

export const createLibrarySchema = Joi.object({
  type: Joi.string().required().label('Type'),
  images: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .max(4)
    .required()
    .label('Images'),
  templateGroup: Joi.string().allow('').label('Template Group'),
  category: Joi.string().default('model').label('Category'),
  tags: Joi.array().items(Joi.string()).default([]).label('Tags'),
  createdBy: Joi.alternatives().try(
    Joi.string(),
    Joi.object().unknown(true)  // For MongoDB ObjectId
  ).required().label('Created By'),
});
