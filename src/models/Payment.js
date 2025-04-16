// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    paymentIntentId: {
      type: String, // optional if invoice is used
    },
    invoiceId: {
      type: String,
    },
    subscriptionId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['succeeded', 'failed', 'pending', 'paid', 'open', 'unpaid', 'canceled'],
      required: true,
    },
    description: {
      type: String,
    },
    paymentMethod: {
      type: String, // e.g., "card"
    },
    receiptUrl: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
