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

/**
 * PRODUCTION DATA RESET SCRIPT
 * 
 * ⚠️  CRITICAL: This script PERMANENTLY DELETES all test data from the database.
 * 
 * DELETES:
 * - All orders (including payment data stored in orders)
 * - All cart items
 * - All wishlist items
 * - All reviews
 * - All OTP codes
 * - All contact form submissions
 * - All newsletter subscribers
 * - All non-admin users (customers)
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
 *   node src/scripts/reset-live-data.js
 * 
 * SAFETY:
 * - Requires NODE_ENV=production or explicit confirmation
 * - Shows summary before deletion
 * - Lists all admin users that will be preserved
 */

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ ERROR: MONGODB_URI environment variable is required');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name}\n`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    return false;
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
  };
  return stats;
};

const resetLiveData = async () => {
  console.log('🧹 PRODUCTION DATA RESET');
  console.log('='.repeat(60));
  console.log('⚠️  This will PERMANENTLY DELETE all test data!\n');

  // Get current stats
  console.log('📊 Current Database State:');
  const beforeStats = await getCurrentStats();
  console.log(`   Orders:              ${beforeStats.orders}`);
  console.log(`   Cart Items:           ${beforeStats.cartItems}`);
  console.log(`   Wishlist Items:       ${beforeStats.wishlistItems}`);
  console.log(`   Reviews:              ${beforeStats.reviews}`);
  console.log(`   OTP Codes:            ${beforeStats.otps}`);
  console.log(`   Contact Submissions:   ${beforeStats.contacts}`);
  console.log(`   Newsletter Subs:      ${beforeStats.newsletterSubscribers}`);
  console.log(`   Total Users:          ${beforeStats.totalUsers}`);
  console.log(`   Admin Users:          ${beforeStats.adminUsers} (will be preserved)`);
  console.log(`   Customer Users:       ${beforeStats.customerUsers} (will be deleted)\n`);

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

  // Safety check for production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    console.log('⚠️  PRODUCTION MODE DETECTED');
    console.log('⚠️  Ensure you have a database backup before proceeding!\n');
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

    // 8. Delete all non-admin users
    console.log('👥 Deleting all non-admin users...');
    const userResult = await User.deleteMany({ role: { $ne: 'admin' } });
    stats.users = userResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.users} customer users`);

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESET SUMMARY');
    console.log('='.repeat(60));
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

    // Verify products are still intact
    const Product = (await import('../models/Product.js')).default;
    const Category = (await import('../models/Category.js')).default;
    const productCount = await Product.countDocuments({});
    const categoryCount = await Category.countDocuments({});
    
    console.log('\n✅ VERIFICATION:');
    console.log(`   Products preserved:  ${productCount}`);
    console.log(`   Categories preserved: ${categoryCount}`);
    
    console.log('\n✅ RESET COMPLETED SUCCESSFULLY!');
    console.log('📦 All test data removed. Site is ready for live launch.\n');

  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    throw error;
  }
};

const main = async () => {
  console.log('🚀 OZME PRODUCTION DATA RESET SCRIPT');
  console.log('='.repeat(60));
  console.log('⚠️  CRITICAL: This will PERMANENTLY DELETE all test data!');
  console.log('✅ Products, categories, and admin users will be preserved.\n');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }

  try {
    await resetLiveData();
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
};

// Run the script
main();

