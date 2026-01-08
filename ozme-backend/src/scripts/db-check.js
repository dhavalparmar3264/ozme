#!/usr/bin/env node
/**
 * Database Verification Script
 * 
 * Connects to MongoDB using MONGODB_URI and prints:
 * - Connected host/database name
 * - Counts: products, users, orders
 * 
 * Usage: node src/scripts/db-check.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

/**
 * Safely mask MongoDB URI for logging (hide password)
 */
const maskMongoURI = (uri) => {
  if (!uri) return 'not set';
  try {
    const match = uri.match(/^(mongodb\+srv:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (match) {
      const [, protocol, username, password, rest] = match;
      return `${protocol}${username}:***@${rest}`;
    }
    const match2 = uri.match(/^(mongodb:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (match2) {
      const [, protocol, username, password, rest] = match2;
      return `${protocol}${username}:***@${rest}`;
    }
    return uri;
  } catch (err) {
    return '***';
  }
};

/**
 * Extract database name from MongoDB URI
 */
const extractDatabaseName = (uri) => {
  if (!uri) return 'unknown';
  try {
    // For Atlas URIs: mongodb+srv://user:pass@host/dbname?options
    const uriWithoutQuery = uri.split('?')[0];
    const parts = uriWithoutQuery.split('/');
    if (parts.length > 3 && parts[3]) {
      return parts[3];
    }
    return 'default';
  } catch (err) {
    return 'unknown';
  }
};

const main = async () => {
  console.log('🔍 OZME Database Verification Script');
  console.log('=====================================\n');

  // Get MongoDB URI
  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    console.error('❌ ERROR: MONGODB_URI environment variable is not set.');
    console.error('   Please set MONGODB_URI in .env file.');
    process.exit(1);
  }

  // Display connection info (safe - password masked)
  const maskedURI = maskMongoURI(mongoURI);
  const dbName = extractDatabaseName(mongoURI);
  console.log('📋 Connection Details:');
  console.log(`   URI: ${maskedURI}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);

  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('✅ Connected Successfully!\n');
    console.log('📊 Connection Info:');
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name || dbName}`);
    console.log(`   Port: ${conn.connection.port || 'N/A (Atlas)'}\n`);

    // Get collection counts
    console.log('📈 Collection Counts:');
    
    const productCount = await Product.countDocuments({});
    const activeProductCount = await Product.countDocuments({ active: true });
    const userCount = await User.countDocuments({});
    const adminCount = await User.countDocuments({ role: 'admin' });
    const customerCount = await User.countDocuments({ role: 'user' });
    const orderCount = await Order.countDocuments({});
    const paidOrderCount = await Order.countDocuments({ paymentStatus: 'Paid' });
    const pendingOrderCount = await Order.countDocuments({ paymentStatus: 'Pending' });

    console.log(`   Products: ${productCount} (${activeProductCount} active)`);
    console.log(`   Users: ${userCount} (${adminCount} admin, ${customerCount} customers)`);
    console.log(`   Orders: ${orderCount} (${paidOrderCount} paid, ${pendingOrderCount} pending)\n`);

    // Verify this is the production database
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ Production Environment Detected');
      console.log('   This script is connected to the PRODUCTION database.\n');
    } else {
      console.log('⚠️  WARNING: Not in production mode');
      console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}\n`);
    }

    console.log('✅ Database verification complete!');
    
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Connection Error:');
    console.error(`   ${error.message}\n`);
    console.error('💡 Troubleshooting:');
    console.error('   1. Verify MONGODB_URI is correct in .env');
    console.error('   2. Check MongoDB Atlas cluster is accessible');
    console.error('   3. Verify network/IP whitelist allows this server');
    console.error('   4. Check database credentials are correct');
    process.exit(1);
  }
};

main();

