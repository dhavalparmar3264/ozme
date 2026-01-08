import mongoose from 'mongoose';

/**
 * User Schema
 * @typedef {Object} User
 * @property {string} name - User's full name
 * @property {string} email - User's email address (optional, only for Google OAuth users)
 * @property {string} phone - User's phone number (required for OTP auth, optional for Google)
 * @property {string} googleId - Google OAuth identifier (unique, optional)
 * @property {string[]} authProviders - Authentication providers: 'otp' | 'google'
 * @property {string} role - User role (user/admin)
 * @property {Date} createdAt - Account creation date
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: false, // Optional - only for Google OAuth users
      unique: true,
      sparse: true, // Allows multiple null values but unique when set
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    photoURL: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows multiple null values but unique when set
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'],
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerifiedAt: {
      type: Date,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Login audit tracking
    lastLoginAt: {
      type: Date,
    },
    lastLoginMethod: {
      type: String,
      enum: ['otp', 'google'],
    },
    lastLoginIdentifier: {
      type: String, // Phone number for OTP, email for Google
    },
    lastLoginIp: {
      type: String,
    },
    lastLoginUserAgent: {
      type: String,
    },
    // Account linking and de-duplication
    authProviders: {
      type: [String],
      enum: ['otp', 'google'],
      default: [],
    },
    mergedIntoUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'merged'],
      default: 'active',
    },
    addresses: [
      {
        firstName: {
          type: String,
          required: true,
          trim: true,
        },
        lastName: {
          type: String,
          required: true,
          trim: true,
        },
        email: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
        phone: {
          type: String,
          required: true,
          trim: true,
        },
        street: {
          type: String,
          required: true,
          trim: true,
        },
        apartment: {
          type: String,
          trim: true,
          default: '',
        },
        city: {
          type: String,
          required: true,
          trim: true,
        },
        state: {
          type: String,
          required: true,
          trim: true,
        },
        pinCode: {
          type: String,
          required: true,
          trim: true,
        },
        country: {
          type: String,
          default: 'India',
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    strict: true, // Only save fields defined in schema
    // Explicitly exclude password field if it exists in database
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure password is never included in queries
userSchema.pre(/^find/, function(next) {
  // Exclude password from all queries
  this.select('-password');
  next();
});

// Normalize phone number and remove password before saving
userSchema.pre('save', async function (next) {
  // CRITICAL: Remove password field if it somehow exists (password auth is disabled)
  // This must happen FIRST before any validation
  if (this.password !== undefined && this.password !== null) {
    delete this.password;
    console.warn('[User Model] Password field detected and removed - password auth is disabled');
  }
  
  // Also remove passwordResetToken and passwordResetExpiry if they exist
  if (this.passwordResetToken !== undefined) delete this.passwordResetToken;
  if (this.passwordResetExpiry !== undefined) delete this.passwordResetExpiry;
  
  // Normalize phone to 10-digit format if phone is being set/modified
  if (this.isModified('phone') && this.phone) {
    // Remove all non-digit characters
    let cleanPhone = this.phone.replace(/\D/g, '');
    
    // Remove country code if present (91XXXXXXXXXX -> XXXXXXXXXX)
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.startsWith('91') && cleanPhone.length > 12) {
      cleanPhone = cleanPhone.slice(-10);
    } else {
      cleanPhone = cleanPhone.slice(-10);
    }
    
    // Validate: Must be exactly 10 digits starting with 6-9
    if (cleanPhone && /^[6-9]\d{9}$/.test(cleanPhone)) {
      this.phone = cleanPhone; // Store normalized format
      console.log(`[User Model] Normalized phone before save: ${cleanPhone.slice(0, 2)}****${cleanPhone.slice(-4)}`);
    } else if (cleanPhone) {
      // Invalid format - let mongoose validation handle it
      console.warn(`[User Model] Invalid phone format: ${cleanPhone}`);
    }
  }
  
  next();
});

const User = mongoose.model('User', userSchema);

export default User;

