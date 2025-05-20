import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
      unique: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      default: 'https://www.gravatar.com/avatar/?d=mp',
    },
    password: {
      type: String,
      minlength: 6,
      required: function () {
        return !this.googleId && !this.facebookId && !this.appleId;
      },
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'Male', 'Female', 'other', 'Other', ''],
      default: '',
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer',
    },
    resetCode: { type: String },
    resetCodeExpire: { type: Date },

    // Social Login Fields
    googleId: { type: String },
    facebookId: { type: String },
    appleId: { type: String },
    isVerified: { type: Boolean, default: false },
    socialOnly: { type: Boolean, default: false },
    loginProvider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'apple'],
      default: 'local',
    },
    lastLogin: {
      type: Date,
      default: null
    },
    disable: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: { type: String },
    subscription: {
      subscriptionId: { type: String },
      plan: { type: String },
      status: { type: String },
      currentPeriodEnd: { type: Date },
    },
  },
  { timestamps: true }
);

// Hash password before saving (if password exists)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
