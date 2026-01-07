import 'dotenv/config';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import CartItem from '../models/CartItem.js';
import WishlistItem from '../models/WishlistItem.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

/**
 * Verification script to check if database reset was successful
 * Run this AFTER running reset-live-data.js to verify everything is clean
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

const verifyReset = async () => {
  console.log('🔍 VERIFYING DATABASE RESET');
  console.log('='.repeat(60) + '\n');

  const checks = {
    orders: await Order.countDocuments({}),
    cartItems: await CartItem.countDocuments({}),
    wishlistItems: await WishlistItem.countDocuments({}),
    reviews: await Review.countDocuments({}),
    totalUsers: await User.countDocuments({}),
    adminUsers: await User.countDocuments({ role: 'admin' }),
    customerUsers: await User.countDocuments({ role: { $ne: 'admin' } }),
    products: await Product.countDocuments({}),
    categories: await Category.countDocuments({}),
  };

  console.log('📊 Current Database State:');
  console.log(`   Orders:              ${checks.orders} ${checks.orders === 0 ? '✅' : '❌'}`);
  console.log(`   Cart Items:           ${checks.cartItems} ${checks.cartItems === 0 ? '✅' : '❌'}`);
  console.log(`   Wishlist Items:       ${checks.wishlistItems} ${checks.wishlistItems === 0 ? '✅' : '❌'}`);
  console.log(`   Reviews:              ${checks.reviews} ${checks.reviews === 0 ? '✅' : '❌'}`);
  console.log(`   Total Users:          ${checks.totalUsers}`);
  console.log(`   Admin Users:          ${checks.adminUsers} ${checks.adminUsers > 0 ? '✅' : '❌'}`);
  console.log(`   Customer Users:       ${checks.customerUsers} ${checks.customerUsers === 0 ? '✅' : '❌'}`);
  console.log(`   Products:             ${checks.products} ${checks.products > 0 ? '✅' : '❌'}`);
  console.log(`   Categories:           ${checks.categories} ${checks.categories > 0 ? '✅' : '❌'}\n`);

  // Verification results
  const allClean = 
    checks.orders === 0 &&
    checks.cartItems === 0 &&
    checks.wishlistItems === 0 &&
    checks.reviews === 0 &&
    checks.customerUsers === 0 &&
    checks.adminUsers > 0 &&
    checks.products > 0;

  if (allClean) {
    console.log('✅ VERIFICATION PASSED!');
    console.log('   All test data has been removed.');
    console.log('   Products and admin users are preserved.\n');
    
    // List admin users
    const adminUsers = await User.find({ role: 'admin' }).select('name email');
    if (adminUsers.length > 0) {
      console.log('👤 Admin Users:');
      adminUsers.forEach((admin, idx) => {
        console.log(`   ${idx + 1}. ${admin.name} (${admin.email})`);
      });
    }
  } else {
    console.log('❌ VERIFICATION FAILED!');
    console.log('   Some test data still exists. Please run reset-live-data.js again.\n');
    
    if (checks.orders > 0) console.log(`   ⚠️  ${checks.orders} orders still exist`);
    if (checks.cartItems > 0) console.log(`   ⚠️  ${checks.cartItems} cart items still exist`);
    if (checks.wishlistItems > 0) console.log(`   ⚠️  ${checks.wishlistItems} wishlist items still exist`);
    if (checks.reviews > 0) console.log(`   ⚠️  ${checks.reviews} reviews still exist`);
    if (checks.customerUsers > 0) console.log(`   ⚠️  ${checks.customerUsers} customer users still exist`);
    if (checks.adminUsers === 0) console.log(`   ⚠️  No admin users found!`);
    if (checks.products === 0) console.log(`   ⚠️  No products found!`);
  }

  console.log('\n' + '='.repeat(60));
};

const main = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to database. Exiting...');
    process.exit(1);
  }

  try {
    await verifyReset();
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
};

main();

