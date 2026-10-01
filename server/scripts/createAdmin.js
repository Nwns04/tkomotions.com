import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/User.js';

const args = Object.fromEntries(process.argv.slice(2).map((value) => {
  const [key, ...rest] = value.replace(/^--/, '').split('=');
  return [key, rest.join('=')];
}));

if (!args.email || !args.password || args.password.length < 12) {
  console.error('Usage: npm run create-admin -- --email=you@example.com --password=a-strong-password (12+ characters)');
  process.exit(1);
}

await connectDatabase();
try {
  const passwordHash = await bcrypt.hash(args.password, 12);
  const user = await User.findOneAndUpdate(
    { email: args.email.toLowerCase() },
    { $set: { passwordHash, name: args.name || 'TKO Administrator', active: true } },
    { new: true, upsert: true, runValidators: true },
  );
  console.log(`Administrator ready: ${user.email}`);
} finally {
  await disconnectDatabase();
}
