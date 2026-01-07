import User from '../models/User.js';
import Order from '../models/Order.js';
import WishlistItem from '../models/WishlistItem.js';
import CartItem from '../models/CartItem.js';

/**
 * Link auth provider to existing user
 * @param {Object} user - User document
 * @param {String} provider - Auth provider ('otp', 'google', 'email')
 * @returns {Promise<Object>} Updated user
 */
export const linkAuthProvider = async (user, provider) => {
  if (!user.authProviders || !Array.isArray(user.authProviders)) {
    user.authProviders = [];
  }
  
  if (!user.authProviders.includes(provider)) {
    user.authProviders.push(provider);
    await user.save();
  }
  
  return user;
};

/**
 * Find user by email (excluding merged accounts)
 * @param {String} email - Email address
 * @returns {Promise<Object|null>} User document or null
 */
export const findUserByEmail = async (email) => {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  return await User.findOne({
    email: normalizedEmail,
    accountStatus: { $ne: 'merged' }, // Exclude merged accounts
  });
};

/**
 * Find user by phone (excluding merged accounts)
 * @param {String} phone - Phone number (10-digit)
 * @returns {Promise<Object|null>} User document or null
 */
export const findUserByPhone = async (phone) => {
  if (!phone) return null;
  
  // Normalize phone to 10-digit format
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return null;
  }
  
  return await User.findOne({
    phone: cleanPhone,
    accountStatus: { $ne: 'merged' }, // Exclude merged accounts
  });
};

/**
 * Merge secondary user into primary user
 * @param {Object} primaryUser - Primary user document (will be kept)
 * @param {Object} secondaryUser - Secondary user document (will be merged)
 * @returns {Promise<Object>} Updated primary user
 */
export const mergeAccounts = async (primaryUser, secondaryUser) => {
  console.log(`[Account Merge] Merging user ${secondaryUser._id} into ${primaryUser._id}`);
  
  // 1. Link phone number if missing
  if (!primaryUser.phone && secondaryUser.phone) {
    primaryUser.phone = secondaryUser.phone;
    primaryUser.phoneVerified = secondaryUser.phoneVerified || false;
    primaryUser.phoneVerifiedAt = secondaryUser.phoneVerifiedAt;
  }
  
  // 2. Merge auth providers
  if (secondaryUser.authProviders && Array.isArray(secondaryUser.authProviders)) {
    if (!primaryUser.authProviders || !Array.isArray(primaryUser.authProviders)) {
      primaryUser.authProviders = [];
    }
    secondaryUser.authProviders.forEach(provider => {
      if (!primaryUser.authProviders.includes(provider)) {
        primaryUser.authProviders.push(provider);
      }
    });
  }
  
  // 3. Merge addresses (if any)
  if (secondaryUser.addresses && secondaryUser.addresses.length > 0) {
    if (!primaryUser.addresses || !Array.isArray(primaryUser.addresses)) {
      primaryUser.addresses = [];
    }
    // Add addresses from secondary that don't already exist
    secondaryUser.addresses.forEach(addr => {
      const exists = primaryUser.addresses.some(a => 
        a.street === addr.street && 
        a.city === addr.city && 
        a.pinCode === addr.pinCode
      );
      if (!exists) {
        primaryUser.addresses.push(addr);
      }
    });
  }
  
  // 4. Transfer orders
  await Order.updateMany(
    { user: secondaryUser._id },
    { $set: { user: primaryUser._id } }
  );
  
  // 5. Transfer wishlist items
  await WishlistItem.updateMany(
    { user: secondaryUser._id },
    { $set: { user: primaryUser._id } }
  );
  
  // 6. Transfer cart items
  await CartItem.updateMany(
    { user: secondaryUser._id },
    { $set: { user: primaryUser._id } }
  );
  
  // 7. Mark secondary user as merged
  secondaryUser.accountStatus = 'merged';
  secondaryUser.mergedIntoUserId = primaryUser._id;
  await secondaryUser.save();
  
  // 8. Save primary user
  await primaryUser.save();
  
  console.log(`[Account Merge] Successfully merged user ${secondaryUser._id} into ${primaryUser._id}`);
  
  return primaryUser;
};

/**
 * Check for duplicate users by email and merge if needed
 * @param {String} email - Email address
 * @returns {Promise<Object|null>} Primary user or null
 */
export const checkAndMergeDuplicates = async (email) => {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Find all users with this email (excluding already merged)
  const usersWithEmail = await User.find({
    email: normalizedEmail,
    accountStatus: { $ne: 'merged' },
  }).sort({ createdAt: 1 }); // Oldest first
  
  if (usersWithEmail.length <= 1) {
    return usersWithEmail[0] || null;
  }
  
  // Multiple users found - merge them
  const primaryUser = usersWithEmail[0]; // Oldest account is primary
  const secondaryUsers = usersWithEmail.slice(1);
  
  for (const secondaryUser of secondaryUsers) {
    await mergeAccounts(primaryUser, secondaryUser);
  }
  
  return primaryUser;
};

