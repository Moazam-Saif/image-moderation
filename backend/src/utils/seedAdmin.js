const User = require('../models/User');

/**
 * Seeds a default admin account from environment variables.
 * Idempotent — does nothing if an admin with that email already exists.
 *
 * Required env vars:
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 *
 * If either is missing, this is skipped with a warning (not a crash) —
 * useful for environments where an admin will be promoted manually instead.
 */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      '[Seed] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping default admin creation.'
    );
    return;
  }

  if (password.length < 8) {
    console.warn(
      '[Seed] ADMIN_PASSWORD must be at least 8 characters — skipping default admin creation.'
    );
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });

  if (existing) {
    // Already exists — promote to admin if it somehow isn't, but never touch the password
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`[Seed] Existing user ${email} promoted to admin.`);
    } else {
      console.log(`[Seed] Admin account already exists — skipping.`);
    }
    return;
  }

  // passwordHash field triggers bcrypt hashing via the User model's pre-save hook
  await User.create({
    email,
    passwordHash: password,
    role: 'admin',
  });

  console.log(`[Seed] Default admin account created: ${email}`);
}

module.exports = seedAdmin;
