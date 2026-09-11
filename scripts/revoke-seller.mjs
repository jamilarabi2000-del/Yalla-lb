import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error('Error: SERVICE_ACCOUNT_JSON environment variable is required.');
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
  console.error('Usage: npm run revoke-seller -- <email>');
  process.exit(1);
}

try {
  const user = await getAuth().getUserByEmail(email);
  const currentClaims = user.customClaims || {};
  const sellerId = currentClaims.sellerId;

  await getAuth().setCustomUserClaims(user.uid, { 
    ...currentClaims, 
    sellerActive: false
  });

  if (sellerId) {
    const db = getFirestore();
    await db.collection('sellers').doc(sellerId).set({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }

  console.log(`Successfully revoked seller status (sellerActive: false) for ${user.email} (${user.uid})`);
} catch (error) {
  console.error(`Error revoking seller status for ${email}:`, error instanceof Error ? error.message : error);
  process.exit(1);
}
