import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema
 * @typedef {Object} User
 * @property {string} name - User's full name
 * @property {string} email - User's email address (unique)
 * @property {string} password - Hashed password
 * @property {string} phone - User's phone number
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
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: function() {
        // Password is required only if user is not using Google auth
        return !this.googleId;
      },
      minlength: 8,
      select: false, // Don't return password by default
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
      enum: ['otp', 'google', 'email'],
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
      enum: ['otp', 'google', 'email'],
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
  }
);

// Normalize phone number before saving (ensure consistent format for uniqueness)
userSchema.pre('save', async function (next) {
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
  
  // Hash password before saving (only if password exists and is modified)
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

