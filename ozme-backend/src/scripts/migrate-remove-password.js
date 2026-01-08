/**
 * Migration Script: Remove Password Authentication
 * 
 * This script removes password-related fields from all users and cleans up
 * legacy email/password authentication data.
 * 
 * Usage:
 *   node src/scripts/migrate-remove-password.js
 * 
 * What it does:
 * 1. Removes password field from all users
 * 2. Removes passwordResetToken and passwordResetExpiry fields (if they exist)
 * 3. Removes 'email' from authProviders array
 * 4. Updates lastLoginMethod from 'email' to null or 'otp'/'google'
 * 5. Logs migration statistics
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

// Load environment variables
dotenv.config();

/**
 * Main migration function
 */
async function migrateRemovePassword() {
  try {
    console.log('🚀 Starting password removal migration...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process\n`);

    let updatedCount = 0;
    let passwordRemovedCount = 0;
    let emailProviderRemovedCount = 0;
    let loginMethodUpdatedCount = 0;

    for (const user of users) {
      let needsUpdate = false;
      const updates = {};

      // 1. Remove password field if it exists
      if (user.password !== undefined && user.password !== null) {
        updates.$unset = { password: '' };
        passwordRemovedCount++;
        needsUpdate = true;
      }

      // 2. Remove password reset fields if they exist
      if (user.passwordResetToken !== undefined || user.passwordResetExpiry !== undefined) {
        if (!updates.$unset) updates.$unset = {};
        if (user.passwordResetToken !== undefined) updates.$unset.passwordResetToken = '';
        if (user.passwordResetExpiry !== undefined) updates.$unset.passwordResetExpiry = '';
        needsUpdate = true;
      }

      // 3. Remove 'email' from authProviders if present
      if (user.authProviders && Array.isArray(user.authProviders) && user.authProviders.includes('email')) {
        updates.$pull = { authProviders: 'email' };
        emailProviderRemovedCount++;
        needsUpdate = true;
      }

      // 4. Update lastLoginMethod if it's 'email'
      if (user.lastLoginMethod === 'email') {
        // Determine new login method based on authProviders
        if (user.authProviders && user.authProviders.includes('otp')) {
          updates.lastLoginMethod = 'otp';
        } else if (user.authProviders && user.authProviders.includes('google')) {
          updates.lastLoginMethod = 'google';
        } else {
          // If no valid auth provider, set to null
          updates.lastLoginMethod = null;
        }
        loginMethodUpdatedCount++;
        needsUpdate = true;
      }

      // Apply updates if needed
      if (needsUpdate) {
        await User.updateOne({ _id: user._id }, updates);
        updatedCount++;
        console.log(`✅ Updated user: ${user._id} (${user.email || user.phone || 'no identifier'})`);
      }
    }

    // Print summary
    console.log('\n📈 Migration Summary:');
    console.log(`   Total users processed: ${users.length}`);
    console.log(`   Users updated: ${updatedCount}`);
    console.log(`   Passwords removed: ${passwordRemovedCount}`);
    console.log(`   Email providers removed: ${emailProviderRemovedCount}`);
    console.log(`   Login methods updated: ${loginMethodUpdatedCount}`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const usersWithPassword = await User.countDocuments({ password: { $exists: true, $ne: null } });
    const usersWithEmailProvider = await User.countDocuments({ authProviders: 'email' });
    const usersWithEmailLogin = await User.countDocuments({ lastLoginMethod: 'email' });

    if (usersWithPassword === 0 && usersWithEmailProvider === 0 && usersWithEmailLogin === 0) {
      console.log('✅ Migration verified successfully!');
      console.log('   ✓ No users have password fields');
      console.log('   ✓ No users have email auth provider');
      console.log('   ✓ No users have email login method');
    } else {
      console.log('⚠️  Migration verification found remaining issues:');
      if (usersWithPassword > 0) {
        console.log(`   ⚠️  ${usersWithPassword} users still have password fields`);
      }
      if (usersWithEmailProvider > 0) {
        console.log(`   ⚠️  ${usersWithEmailProvider} users still have email auth provider`);
      }
      if (usersWithEmailLogin > 0) {
        console.log(`   ⚠️  ${usersWithEmailLogin} users still have email login method`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateRemovePassword();
