import User from '../models/User.js';
import { isDBConnected } from '../config/db.js';

/**
 * Bootstrap admin user from environment variables
 * Only runs if ADMIN_BOOTSTRAP=true in .env
 * Creates or updates admin user with credentials from ADMIN_EMAIL and ADMIN_PASSWORD
 */
export const bootstrapAdmin = async () => {
  // Only run if ADMIN_BOOTSTRAP flag is set
  if (process.env.ADMIN_BOOTSTRAP !== 'true') {
    return;
  }

  // Check if DB is connected
  if (!isDBConnected()) {
    console.warn('⚠️  Cannot bootstrap admin: Database not connected');
    return;
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('⚠️  ADMIN_BOOTSTRAP=true but ADMIN_EMAIL or ADMIN_PASSWORD not set');
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (existingAdmin) {
      // Update password and ensure role is admin
      existingAdmin.password = adminPassword;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`✅ Admin user updated: ${adminEmail}`);
      console.log(`   Role: admin`);
      return;
    }

    // Create new admin user
    const admin = await User.create({
      name: 'OZME Admin',
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin',
    });

    console.log(`✅ Admin user created: ${adminEmail}`);
    console.log(`   Role: admin`);
  } catch (error) {
    console.error('❌ Error bootstrapping admin user:', error.message);
    // Don't throw - allow server to continue
  }
};

