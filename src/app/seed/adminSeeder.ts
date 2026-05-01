import bcrypt from 'bcryptjs';
import { User } from '../modules/user/user_model';

export const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not set in env.');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin is already exists.');
      return;
    }

    const saltRounds = Number(process.env.BCRYPT_SALT) || 12;
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || '12345678',
      saltRounds,
    );

    await User.create({
      name: 'Super Admin',
      email: adminEmail,
      role: 'admin',
      password: hashedPassword,
      isVerified: true,
    });
    console.log('Admin user seeded successfully');
  } catch (error) {
    console.error('Failed to seed admin:', error);
  }
};
