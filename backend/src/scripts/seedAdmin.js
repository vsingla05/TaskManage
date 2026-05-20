import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Create or promote an admin user (credentials from .env).
 * Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npm run seed:admin
 */
async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    user.role = 'admin';
    user.password = password;
    user.name = name;
    await user.save();
    console.log('Updated existing user to admin:', email);
    console.log('Login with this email and ADMIN_PASSWORD from backend/.env (password was reset).');
  } else {
    user = await User.create({
      name,
      email,
      password,
      role: 'admin',
    });
    console.log('Created admin user:', email);
    console.log('Login with ADMIN_EMAIL and ADMIN_PASSWORD from backend/.env');
  }
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
