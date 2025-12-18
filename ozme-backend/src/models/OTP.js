import mongoose from 'mongoose';

/**
 * OTP Schema for phone verification
 * Auto-deletes expired OTPs via TTL index
 */
const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    purpose: {
      type: String,
      enum: ['VERIFY', 'LOGIN', 'RESET'],
      default: 'VERIFY',
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5, // Max 5 verification attempts
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index - auto delete when expired
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding OTP by phone and purpose
otpSchema.index({ phone: 1, purpose: 1 });

// Auto-delete documents after 10 minutes (backup cleanup)
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;

