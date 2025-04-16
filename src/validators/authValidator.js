import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$')) 
    .message('Password must contain uppercase, lowercase and number')
    .required(),
  role: Joi.string().valid('admin', 'customer').optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const resetPasswordRequestSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  type: Joi.string()
    .valid('customer', 'admin')
    .required(),
  email: Joi.string()
    .email()
    .required(),
  code: Joi.string()
    .required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$'))
    .message('New password must contain uppercase, lowercase, and number')
    .required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .when('type', {
      is: 'customer',
      then: Joi.required().messages({ 'any.only': 'Passwords do not match' }),
      otherwise: Joi.optional(),
    }),
});

export const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .message('New password must be at least 8 characters long')
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$'))
    .message('New password must contain uppercase, lowercase, and number')
    .required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
});