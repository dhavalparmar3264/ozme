import 'dotenv/config';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import CartItem from '../models/CartItem.js';
import WishlistItem from '../models/WishlistItem.js';
import Review from '../models/Review.js';
import OTP from '../models/OTP.js';
import Contact from '../models/Contact.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

/**
 * PRODUCTION PURGE SCRIPT - PERMANENTLY DELETE ALL TEST DATA
 * 
 * ⚠️  CRITICAL: This script PERMANENTLY DELETES all test data from PRODUCTION database.
 * 
 * SAFETY REQUIREMENTS:
 * - Must set CONFIRM_PROD_PURGE=true environment variable
 * - Prints database connection details for verification
 * - Shows counts before deletion
 * - Requires explicit confirmation
 * 
 * DELETES:
 * - All orders (including payment data)
 * - All cart items
 * - All wishlist items
 * - All reviews
 * - All OTP codes
 * - All contact form submissions
 * - All newsletter subscribers
 * - All non-admin users (including dhavalparmar3264@gmail.com)
 * 
 * PRESERVES:
 * - Products and product data
 * - Categories
 * - Inventory/stock data (stored in products)
 * - Admin users (role: 'admin')
 * - Coupons
 * - FAQs
 * - Policies
 * 
 * USAGE:
 *   CONFIRM_PROD_PURGE=true node src/scripts/purge-live-test-data.js
 */

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ ERROR: MONGODB_URI environment variable is required');
      process.exit(1);
    }
    
    // Mask password in URI for logging
    const maskedURI = mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${maskedURI}`);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    const dbHost = mongoose.connection.host;
    
    console.log(`✅ MongoDB Connected:`);
    console.log(`   Host: ${dbHost}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}\n`);
    
    return { dbName, dbHost };
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    return null;
  }
};

const getCurrentStats = async () => {
  const stats = {
    orders: await Order.countDocuments({}),
    cartItems: await CartItem.countDocuments({}),
    wishlistItems: await WishlistItem.countDocuments({}),
    reviews: await Review.countDocuments({}),
    otps: await OTP.countDocuments({}),
    contacts: await Contact.countDocuments({}),
    newsletterSubscribers: await NewsletterSubscriber.countDocuments({}),
    totalUsers: await User.countDocuments({}),
    adminUsers: await User.countDocuments({ role: 'admin' }),
    customerUsers: await User.countDocuments({ role: { $ne: 'admin' } }),
    products: await Product.countDocuments({}),
    categories: await Category.countDocuments({}),
  };
  
  // Get specific user if exists
  const testUser = await User.findOne({ email: 'dhavalparmar3264@gmail.com' });
  if (testUser) {
    const userOrders = await Order.countDocuments({ user: testUser._id });
    stats.testUserExists = true;
    stats.testUserOrders = userOrders;
  } else {
    stats.testUserExists = false;
    stats.testUserOrders = 0;
  }
  
  return stats;
};

const purgeLiveData = async (dbInfo) => {
  console.log('🧹 PRODUCTION DATA PURGE');
  console.log('='.repeat(70));
  console.log(`⚠️  TARGET DATABASE: ${dbInfo.dbHost}/${dbInfo.dbName}`);
  console.log('⚠️  This will PERMANENTLY DELETE all test data!\n');

  // Get current stats
  console.log('📊 Current Database State:');
  const beforeStats = await getCurrentStats();
  console.log(`   Orders:              ${beforeStats.orders}`);
  console.log(`   Cart Items:           ${beforeStats.cartItems}`);
  console.log(`   Wishlist Items:       ${beforeStats.wishlistItems}`);
  console.log(`   Reviews:              ${beforeStats.reviews}`);
  console.log(`   OTP Codes:            ${beforeStats.otps}`);
  console.log(`   Contact Submissions:  ${beforeStats.contacts}`);
  console.log(`   Newsletter Subs:      ${beforeStats.newsletterSubscribers}`);
  console.log(`   Total Users:          ${beforeStats.totalUsers}`);
  console.log(`   Admin Users:          ${beforeStats.adminUsers} (will be preserved)`);
  console.log(`   Customer Users:       ${beforeStats.customerUsers} (will be deleted)`);
  console.log(`   Products:             ${beforeStats.products} (will be preserved)`);
  console.log(`   Categories:           ${beforeStats.categories} (will be preserved)`);
  
  if (beforeStats.testUserExists) {
    console.log(`\n   ⚠️  TEST USER FOUND: dhavalparmar3264@gmail.com`);
    console.log(`      Orders for this user: ${beforeStats.testUserOrders} (will be deleted)`);
  }
  console.log('');

  // List admin users
  const adminUsers = await User.find({ role: 'admin' }).select('name email role');
  if (adminUsers.length > 0) {
    console.log('👤 Admin Users to Preserve:');
    adminUsers.forEach((admin, idx) => {
      console.log(`   ${idx + 1}. ${admin.name} (${admin.email})`);
    });
    console.log('');
  } else {
    console.log('⚠️  WARNING: No admin users found! This may lock you out of /admin\n');
  }

  const stats = {
    orders: 0,
    cartItems: 0,
    wishlistItems: 0,
    reviews: 0,
    otps: 0,
    contacts: 0,
    newsletterSubscribers: 0,
    users: 0,
    adminUsersKept: adminUsers.map(u => ({ email: u.email, name: u.name })),
  };

  try {
    // 1. Delete all orders (includes payment data stored in orders)
    console.log('📦 Deleting all orders...');
    const orderResult = await Order.deleteMany({});
    stats.orders = orderResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.orders} orders`);

    // 2. Delete all cart items
    console.log('🛒 Deleting all cart items...');
    const cartResult = await CartItem.deleteMany({});
    stats.cartItems = cartResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.cartItems} cart items`);

    // 3. Delete all wishlist items
    console.log('❤️  Deleting all wishlist items...');
    const wishlistResult = await WishlistItem.deleteMany({});
    stats.wishlistItems = wishlistResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.wishlistItems} wishlist items`);

    // 4. Delete all reviews
    console.log('⭐ Deleting all reviews...');
    const reviewResult = await Review.deleteMany({});
    stats.reviews = reviewResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.reviews} reviews`);

    // 5. Delete all OTP codes
    console.log('🔐 Deleting all OTP codes...');
    const otpResult = await OTP.deleteMany({});
    stats.otps = otpResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.otps} OTP codes`);

    // 6. Delete all contact form submissions
    console.log('📧 Deleting all contact form submissions...');
    const contactResult = await Contact.deleteMany({});
    stats.contacts = contactResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.contacts} contact submissions`);

    // 7. Delete all newsletter subscribers
    console.log('📰 Deleting all newsletter subscribers...');
    const newsletterResult = await NewsletterSubscriber.deleteMany({});
    stats.newsletterSubscribers = newsletterResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.newsletterSubscribers} newsletter subscribers`);

    // 8. Delete all non-admin users (including dhavalparmar3264@gmail.com)
    console.log('👥 Deleting all non-admin users...');
    const userResult = await User.deleteMany({ role: { $ne: 'admin' } });
    stats.users = userResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.users} customer users`);

    // Verify deletion
    const afterStats = await getCurrentStats();
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 PURGE SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Orders deleted:              ${stats.orders}`);
    console.log(`✅ Cart items deleted:           ${stats.cartItems}`);
    console.log(`✅ Wishlist items deleted:       ${stats.wishlistItems}`);
    console.log(`✅ Reviews deleted:              ${stats.reviews}`);
    console.log(`✅ OTP codes deleted:           ${stats.otps}`);
    console.log(`✅ Contact submissions deleted:  ${stats.contacts}`);
    console.log(`✅ Newsletter subs deleted:      ${stats.newsletterSubscribers}`);
    console.log(`✅ Customer users deleted:        ${stats.users}`);
    console.log(`✅ Admin users preserved:        ${stats.adminUsersKept.length}`);
    
    if (stats.adminUsersKept.length > 0) {
      console.log('\n👤 Admin Users Preserved:');
      stats.adminUsersKept.forEach((admin, idx) => {
        console.log(`   ${idx + 1}. ${admin.name} (${admin.email})`);
      });
    }

    // Verification
    console.log('\n✅ VERIFICATION:');
    console.log(`   Orders remaining:     ${afterStats.orders} ${afterStats.orders === 0 ? '✅' : '❌'}`);
    console.log(`   Customer users:        ${afterStats.customerUsers} ${afterStats.customerUsers === 0 ? '✅' : '❌'}`);
    console.log(`   Test user exists:      ${afterStats.testUserExists ? '❌ YES (ERROR!)' : '✅ NO'}`);
    console.log(`   Admin users:           ${afterStats.adminUsers} ${afterStats.adminUsers > 0 ? '✅' : '❌'}`);
    console.log(`   Products preserved:    ${afterStats.products} ${afterStats.products > 0 ? '✅' : '❌'}`);
    console.log(`   Categories preserved: ${afterStats.categories} ${afterStats.categories > 0 ? '✅' : '❌'}`);
    
    if (afterStats.orders > 0 || afterStats.customerUsers > 0 || afterStats.testUserExists) {
      console.log('\n❌ PURGE INCOMPLETE! Some data still exists.');
      console.log('   Please check the database manually or run the script again.');
    } else {
      console.log('\n✅ PURGE COMPLETED SUCCESSFULLY!');
      console.log('📦 All test data removed. Site is ready for live launch.');
    }

    console.log('\n' + '='.repeat(70));
    console.log(`📊 Database: ${dbInfo.dbHost}/${dbInfo.dbName}`);
    console.log(`⏰ Purge completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error during purge:', error);
    throw error;
  }
};

const main = async () => {
  console.log('🚀 OZME PRODUCTION DATA PURGE SCRIPT');
  console.log('='.repeat(70));
  
  // Safety check
  if (process.env.CONFIRM_PROD_PURGE !== 'true') {
    console.error('❌ SAFETY CHECK FAILED!');
    console.error('');
    console.error('This script requires explicit confirmation to run.');
    console.error('Set CONFIRM_PROD_PURGE=true environment variable to proceed.');
    console.error('');
    console.error('Usage:');
    console.error('  CONFIRM_PROD_PURGE=true node src/scripts/purge-live-test-data.js');
    console.error('');
    process.exit(1);
  }

  console.log('⚠️  CRITICAL: This will PERMANENTLY DELETE all test data!');
  console.log('✅ Products, categories, and admin users will be preserved.\n');

  const dbInfo = await connectDB();
  if (!dbInfo) {
    console.error('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }

  try {
    await purgeLiveData(dbInfo);
  } catch (error) {
    console.error('❌ Purge failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
};

// Run the script
main();

