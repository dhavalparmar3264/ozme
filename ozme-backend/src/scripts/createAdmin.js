import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

/**
 * Create admin user from environment variables
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD from .env
 */
const createAdmin = async () => {
    try {
        // Connect to database
        await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@ozme.in';
        const adminPassword = process.env.ADMIN_PASSWORD || 'ozme123';

        if (!adminEmail || !adminPassword) {
            console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
            process.exit(1);
        }

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });

        if (existingAdmin) {
            console.log(`✅ Admin user already exists with email: ${adminEmail}`);
            
            // Update password and ensure role is admin
            existingAdmin.password = adminPassword;
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log(`✅ Admin password updated and role set to admin`);
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            
            process.exit(0);
        }

        // Create new admin user
        const admin = await User.create({
            name: 'OZME Admin',
            email: adminEmail.toLowerCase(),
            password: adminPassword,
            role: 'admin',
            phone: '+91 1234567890',
        });

        console.log('✅ Admin user created successfully!');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log('👤 Role: admin');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        process.exit(1);
    }
};

// Run the script
createAdmin();