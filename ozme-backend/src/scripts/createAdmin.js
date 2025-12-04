import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

/**
 * Create hardcoded admin user
 * Email: admin@ozme.in
 * Password: Ozme@123 (8 characters minimum)
 */
const createAdmin = async () => {
    try {
        // Connect to database
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@ozme.in' });

        if (existingAdmin) {
            console.log('✅ Admin user already exists with email: admin@ozme.in');

            // Update password if needed
            existingAdmin.password = 'Ozme@123';
            await existingAdmin.save();
            console.log('✅ Admin password updated to: Ozme@123');

            process.exit(0);
        }

        // Create new admin user
        const admin = await User.create({
            name: 'OZME Admin',
            email: 'admin@ozme.in',
            password: 'Ozme@123',
            role: 'admin',
            phone: '+91 1234567890',
        });

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@ozme.in');
        console.log('🔑 Password: Ozme@123');
        console.log('👤 Role: admin');
        console.log('\n⚠️  IMPORTANT: Please update .env file with your actual credentials');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        process.exit(1);
    }
};

// Run the script
createAdmin();
