// models/CustomerProfile.js
import mongoose from 'mongoose';

const customerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    preferences: {
      newsletter: { type: Boolean, default: false },
      notifications: { type: Boolean, default: true },
      securityNotifications: { type: Boolean, default: true },
      imageReadyNotification: { type: Boolean, default: true },
      billingNotification: { type: Boolean, default: true },
    },
    billingInfo: {
      paymentMethod: { type: String, enum: ['card', 'paypal'], default: 'card' },
      cardInfo: {
        cardHolderName: { type: String },
        cardNumber: { type: String },
        expiryMonth: { type: Number },
        expiryYear: { type: Number },
        cvv: { type: String },
        default: { type: Boolean, default: false },
      },
      paypalEmail: { type: String },
      billingAddress: {
        address: { type: String },
        city: { type: String },
        state: { type: String },
        zip: { type: String },
      },
      
    },
    accountStatus: {
      permanentlyDeleted: { type: Boolean, default: false },
      temporarilyDisabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model('CustomerProfile', customerProfileSchema);
