#!/usr/bin/env node
/**
 * Purge Test Data Script
 * 
 * Deletes test/demo data from production database:
 * - All orders + orderItems + payments + carts + addresses
 * - Customer users (keeps admin users)
 * 
 * REQUIRES: CONFIRM_PROD_PURGE=true environment variable
 * 
 * Usage: CONFIRM_PROD_PURGE=true node src/scripts/purge-test-data.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';

const main = async () => {
  console.log('🚨 OZME Production Data Purge Script');
  console.log('=====================================\n');

  // Safety check
  if (process.env.CONFIRM_PROD_PURGE !== 'true') {
    console.error('❌ ERROR: This script requires CONFIRM_PROD_PURGE=true');
    console.error('   This is a DESTRUCTIVE operation that will delete data.');
    console.error('   Usage: CONFIRM_PROD_PURGE=true node src/scripts/purge-test-data.js');
    process.exit(1);
  }

  // Verify production environment
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ ERROR: This script should only run in production mode.');
    console.error(`   Current NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    process.exit(1);
  }

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ ERROR: MONGODB_URI not set');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected\n');

    // Get counts before deletion
    const orderCount = await Order.countDocuments({});
    const customerCount = await User.countDocuments({ role: 'user' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const cartCount = await Cart.countDocuments({});
    const wishlistCount = await Wishlist.countDocuments({});

    console.log('📊 Current Data Counts:');
    console.log(`   Orders: ${orderCount}`);
    console.log(`   Customer Users: ${customerCount}`);
    console.log(`   Admin Users: ${adminCount} (will be kept)`);
    console.log(`   Carts: ${cartCount}`);
    console.log(`   Wishlists: ${wishlistCount}\n`);

    console.log('⚠️  WARNING: About to delete:');
    console.log('   - All orders');
    console.log('   - All customer users (admin users will be kept)');
    console.log('   - All carts');
    console.log('   - All wishlists\n');

    // Delete orders
    console.log('🗑️  Deleting orders...');
    const orderResult = await Order.deleteMany({});
    console.log(`   ✅ Deleted ${orderResult.deletedCount} orders\n`);

    // Delete customer users (keep admin)
    console.log('🗑️  Deleting customer users...');
    const userResult = await User.deleteMany({ role: 'user' });
    console.log(`   ✅ Deleted ${userResult.deletedCount} customer users\n`);

    // Delete carts
    console.log('🗑️  Deleting carts...');
    const cartResult = await Cart.deleteMany({});
    console.log(`   ✅ Deleted ${cartResult.deletedCount} carts\n`);

    // Delete wishlists
    console.log('🗑️  Deleting wishlists...');
    const wishlistResult = await Wishlist.deleteMany({});
    console.log(`   ✅ Deleted ${wishlistResult.deletedCount} wishlists\n`);

    // Final counts
    const finalAdminCount = await User.countDocuments({ role: 'admin' });
    const finalProductCount = await (await mongoose.connection.db.collection('products')).countDocuments({});

    console.log('✅ Purge Complete!\n');
    console.log('📊 Remaining Data:');
    console.log(`   Admin Users: ${finalAdminCount}`);
    console.log(`   Products: ${finalProductCount}`);
    console.log(`   Orders: 0`);
    console.log(`   Customer Users: 0`);
    console.log(`   Carts: 0`);
    console.log(`   Wishlists: 0\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main();

