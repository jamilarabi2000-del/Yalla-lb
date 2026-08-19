import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error('Error: SERVICE_ACCOUNT_JSON environment variable is required.');
  console.error('Please run with: SERVICE_ACCOUNT_JSON="$(cat serviceAccount.json)" npm run grant-admin -- email@example.com');
  process.exit(1);
}

try {
  initializeApp({ cert: cert(JSON.parse(serviceAccountJson)) });
} catch (err) {
  console.error('Failed to initialize Firebase Admin SDK. Check SERVICE_ACCOUNT_JSON format.', err);
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run grant-admin -- <email>');
  process.exit(1);
}

try {
  const user = await getAuth().getUserByEmail(email);
  await getAuth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`Successfully granted admin privileges to ${user.email} (${user.uid})`);
} catch (error) {
  console.error(`Error granting admin privileges to ${email}:`, error instanceof Error ? error.message : error);
  process.exit(1);
}
