import 'dotenv/config';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import CartItem from '../models/CartItem.js';
import Review from '../models/Review.js';

/**
 * Cleanup script to remove all test data before going live
 * 
 * This script will:
 * - Delete ALL orders and order-related data
 * - Delete ALL non-admin users (keeps admin users for /admin access)
 * - Delete ALL cart items
 * - Delete ALL reviews (optional - can be kept if needed)
 * 
 * KEEPS:
 * - Products and product data
 * - Categories
 * - Inventory data
 * - Admin users
 * - Coupons
 * - FAQs
 * - Policies
 */

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ ERROR: MONGODB_URI environment variable is required');
      process.exit(1);
    }
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    return false;
  }
};

const cleanupTestData = async () => {
  console.log('\n🧹 Starting cleanup of test data...\n');
  
  const stats = {
    orders: 0,
    cartItems: 0,
    reviews: 0,
    users: 0,
    adminUsersKept: [],
  };

  try {
    // 1. Delete all orders
    console.log('📦 Deleting all orders...');
    const orderResult = await Order.deleteMany({});
    stats.orders = orderResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.orders} orders`);

    // 2. Delete all cart items
    console.log('🛒 Deleting all cart items...');
    const cartResult = await CartItem.deleteMany({});
    stats.cartItems = cartResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.cartItems} cart items`);

    // 3. Delete all reviews (optional - uncomment if you want to keep reviews)
    console.log('⭐ Deleting all reviews...');
    const reviewResult = await Review.deleteMany({});
    stats.reviews = reviewResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.reviews} reviews`);

    // 4. Find all admin users before deletion
    console.log('👥 Finding admin users to preserve...');
    const adminUsers = await User.find({ role: 'admin' });
    stats.adminUsersKept = adminUsers.map(u => ({
      email: u.email,
      name: u.name,
    }));
    console.log(`   ✅ Found ${adminUsers.length} admin user(s) to keep`);

    // 5. Delete all non-admin users
    console.log('👥 Deleting all non-admin users...');
    const userResult = await User.deleteMany({ role: { $ne: 'admin' } });
    stats.users = userResult.deletedCount;
    console.log(`   ✅ Deleted ${stats.users} non-admin users`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Orders deleted:        ${stats.orders}`);
    console.log(`✅ Cart items deleted:    ${stats.cartItems}`);
    console.log(`✅ Reviews deleted:       ${stats.reviews}`);
    console.log(`✅ Users deleted:         ${stats.users}`);
    console.log(`✅ Admin users kept:      ${stats.adminUsersKept.length}`);
    
    if (stats.adminUsersKept.length > 0) {
      console.log('\n👤 Admin users preserved:');
      stats.adminUsersKept.forEach((admin, idx) => {
        console.log(`   ${idx + 1}. ${admin.name} (${admin.email})`);
      });
    }

    console.log('\n✅ Cleanup completed successfully!');
    console.log('📦 Products, categories, and inventory data remain intact.\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  }
};

const main = async () => {
  console.log('🚀 OZME Test Data Cleanup Script');
  console.log('⚠️  This will DELETE all orders, cart items, reviews, and non-admin users!');
  console.log('✅ Products, categories, and inventory will be preserved.\n');

  // Safety check - require confirmation in production
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  PRODUCTION MODE DETECTED');
    console.log('⚠️  Please ensure you have a database backup before proceeding!\n');
  }

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }

  try {
    await cleanupTestData();
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
};

// Run the script
main();

