#!/usr/bin/env node

/**
 * Generate SHA-256 password hash for PaperTracker auth
 * Usage: node generate-password-hash.js <password>
 */

async function generatePasswordHash(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const password = process.argv[2];

if (!password) {
  console.error('Usage: node generate-password-hash.js <password>');
  process.exit(1);
}

generatePasswordHash(password).then(hash => {
  console.log('\n=== PaperTracker Password Hash ===\n');
  console.log('Your password hash:');
  console.log(hash);
  console.log('\nTo set this as a secret, run:');
  console.log(`npx wrangler secret put ADMIN_PASSWORD_HASH`);
  console.log('\nThen paste the hash above when prompted.\n');
});
