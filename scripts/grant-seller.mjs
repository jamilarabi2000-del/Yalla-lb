import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error('Error: SERVICE_ACCOUNT_JSON environment variable is required.');
  console.error('Please run with: SERVICE_ACCOUNT_JSON="$(cat serviceAccount.json)" npm run grant-seller -- email@example.com');
  process.exit(1);
}

try {
  initializeApp({ cert: cert(JSON.parse(serviceAccountJson)) });
} catch (err) {
  console.error('Failed to initialize Firebase Admin SDK. Check SERVICE_ACCOUNT_JSON format.', err);
  process.exit(1);
}

const email = process.argv[2];
const sellerId = process.argv[3];
if (!email) {
  console.error('Usage: npm run grant-seller -- <email> [sellerId]');
  process.exit(1);
}

try {
  const user = await getAuth().getUserByEmail(email);
  const currentClaims = user.customClaims || {};
  await getAuth().setCustomUserClaims(user.uid, { 
    ...currentClaims, 
    seller: true,
    ...(sellerId ? { sellerId: sellerId.trim() } : {})
  });
  console.log(`Successfully granted seller privileges (seller: true${sellerId ? `, sellerId: "${sellerId.trim()}"` : ''}) to ${user.email} (${user.uid})`);
} catch (error) {
  console.error(`Error granting seller privileges to ${email}:`, error instanceof Error ? error.message : error);
  process.exit(1);
}
