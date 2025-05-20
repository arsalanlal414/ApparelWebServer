// import Joi from "joi";

// export const billingInfoSchema = Joi.object({
//   paymentMethod: Joi.string().valid("card", "paypal").required(),
//   cardInfo: Joi.object({
//     cardHolderName: Joi.string().optional(),
//     cardNumber: Joi.string().optional(),
//     expiryMonth: Joi.number().optional(),
//     expiryYear: Joi.number().optional(),
//     cvv: Joi.string().optional(), 
//     default: Joi.boolean().optional(),
//   }),
//   paypalEmail: Joi.string().email().optional(),
//   billingAddress: Joi.object({
//     address: Joi.string().optional(),
//     city: Joi.string().optional(),
//     state: Joi.string().optional(),
//     zip: Joi.string().optional(),
//   }),
// });



import Joi from "joi";

export const billingInfoSchema = Joi.object({
  paymentMethod: Joi.string().valid("card", "paypal").required(),

  cardInfo: Joi.object({
    cardHolderName: Joi.string()
      .pattern(/^[a-zA-Z\s]+$/)
      .when('...paymentMethod', {
        is: 'card',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
    cardNumber: Joi.string()
      .pattern(/^\d{16}$/)
      .message("Card number must be 16 digits")
      .when('...paymentMethod', {
        is: 'card',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
    expiryMonth: Joi.number()
      .integer()
      .min(1)
      .max(12)
      .when('...paymentMethod', {
        is: 'card',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
    expiryYear: Joi.number()
      .integer()
      .min(new Date().getFullYear())
      .max(new Date().getFullYear() + 10)
      .when('...paymentMethod', {
        is: 'card',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
    cvv: Joi.string()
      .pattern(/^[0-9]{3,4}$/)
      .message("CVV must be 3 or 4 digits")
      .when('...paymentMethod', {
        is: 'card',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
    default: Joi.boolean().optional(),
  }).when('paymentMethod', {
    is: 'card',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),


  paypalEmail: Joi.string()
    .email()
    .when('paymentMethod', {
      is: 'paypal',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),

  billingAddress: Joi.object({
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().optional(),
    zip: Joi.string()
      .pattern(/^\d{5}(-\d{4})?$/)
      .message("ZIP code must be 5 digits or ZIP+4 format")
      .required(),
  }).required(),
});

export const updateCustomerAdminSchema = Joi.object({
  // User fields
  name: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  password: Joi.string().min(6).max(64).optional(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).optional(),

  // CustomerProfile fields
  preferences: Joi.object({
    newsletter: Joi.boolean(),
    notifications: Joi.boolean(),
    securityNotifications: Joi.boolean(),
    imageReadyNotification: Joi.boolean(),
    billingNotification: Joi.boolean(),
  }).optional(),

  billingInfo: Joi.object({
    paymentMethod: Joi.string().valid('card', 'paypal').optional(),
    cardInfo: Joi.object({
      cardHolderName: Joi.string().optional(),
      cardNumber: Joi.string().creditCard().optional(),
      expiryMonth: Joi.number().integer().min(1).max(12).optional(),
      expiryYear: Joi.number().integer().min(new Date().getFullYear()).optional(),
      cvv: Joi.string().pattern(/^\d{3,4}$/).optional(),
      default: Joi.boolean().optional(),
    }).optional(),
    paypalEmail: Joi.string().email().optional(),
    billingAddress: Joi.object({
      address: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zip: Joi.string().optional(),
    }).optional(),
  }).optional(),

  accountStatus: Joi.object({
    permanentlyDeleted: Joi.boolean(),
    temporarilyDisabled: Joi.boolean(),
  }).optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
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