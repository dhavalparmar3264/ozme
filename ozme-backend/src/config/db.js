import mongoose from 'mongoose';

let isConnected = false;
let connectionInfo = null;

// Disable Mongoose buffering - fail fast instead of hanging
// This prevents "buffering timed out" errors when DB is not connected
mongoose.set('bufferCommands', false);

/**
 * Safely mask MongoDB URI for logging (hide password)
 * @param {string} uri - MongoDB connection string
 * @returns {string} - Masked URI
 */
const maskMongoURI = (uri) => {
  if (!uri) return 'not set';
  try {
    // Match: mongodb+srv://username:password@host/db
    const match = uri.match(/^(mongodb\+srv:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (match) {
      const [, protocol, username, password, rest] = match;
      const maskedPassword = password ? '***' : '';
      return `${protocol}${username}:${maskedPassword}@${rest}`;
    }
    // Match: mongodb://username:password@host:port/db
    const match2 = uri.match(/^(mongodb:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (match2) {
      const [, protocol, username, password, rest] = match2;
      const maskedPassword = password ? '***' : '';
      return `${protocol}${username}:${maskedPassword}@${rest}`;
    }
    return uri; // Return as-is if pattern doesn't match
  } catch (err) {
    return '***'; // Safe fallback
  }
};

/**
 * Extract database name from MongoDB URI
 * @param {string} uri - MongoDB connection string
 * @returns {string} - Database name or 'default'
 */
const extractDatabaseName = (uri) => {
  if (!uri) return 'unknown';
  try {
    // For Atlas URIs: mongodb+srv://user:pass@host/dbname?options
    // Extract database name before ? or after last /
    const uriWithoutQuery = uri.split('?')[0]; // Remove query params
    const parts = uriWithoutQuery.split('/');
    if (parts.length > 3 && parts[3]) {
      // Found database name
      return parts[3];
    }
    // If no explicit database, MongoDB uses default database (usually 'test' or connection string default)
    return 'default';
  } catch (err) {
    return 'unknown';
  }
};

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // CRITICAL: Use MONGODB_URI from environment (production Atlas)
    // NO fallback to localhost in production
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set. Please set it in .env file.');
    }

    // Log connection attempt (safe - password masked)
    const maskedURI = maskMongoURI(mongoURI);
    const dbName = extractDatabaseName(mongoURI);
    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log(`   URI: ${maskedURI}`);
    console.log(`   Database: ${dbName}`);
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for Atlas
      connectTimeoutMS: 10000, // 10s connection timeout
      socketTimeoutMS: 45000, // 45s socket timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      retryWrites: true,
      w: 'majority',
    });

    isConnected = true;
    connectionInfo = {
      host: conn.connection.host,
      name: conn.connection.name,
      port: conn.connection.port,
    };
    
    // Safe logging - no secrets
    console.log(`✅ MongoDB Connected Successfully`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name || dbName}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });
  } catch (error) {
    isConnected = false;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('⚠️ Server will continue without database connection.');
    console.error('💡 Please verify:');
    console.error('   1. MONGODB_URI is set in .env file');
    console.error('   2. MongoDB Atlas cluster is accessible');
    console.error('   3. Network/IP whitelist allows this server');
    console.error('   4. Database credentials are correct');
    // Don't exit - allow server to start without DB for graceful degradation
  }
};

/**
 * Check if MongoDB is connected
 * @returns {boolean}
 */
export const isDBConnected = () => isConnected;

/**
 * Get connection info (safe - no secrets)
 * @returns {Object|null} Connection info or null
 */
export const getConnectionInfo = () => {
  if (!isConnected || !connectionInfo) return null;
  return {
    ...connectionInfo,
    connected: true,
  };
};

export default connectDB;

