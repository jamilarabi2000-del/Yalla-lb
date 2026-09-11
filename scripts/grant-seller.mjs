import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
  const effectiveSellerId = sellerId ? sellerId.trim() : (currentClaims.sellerId || `seller-${user.uid}`);
  
  await getAuth().setCustomUserClaims(user.uid, { 
    ...currentClaims, 
    seller: true,
    sellerActive: true,
    sellerId: effectiveSellerId
  });

  const db = getFirestore();
  const sellerRef = db.collection('sellers').doc(effectiveSellerId);
  await sellerRef.set({
    id: effectiveSellerId,
    isActive: true,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`Successfully granted seller privileges (seller: true, sellerActive: true, sellerId: "${effectiveSellerId}") to ${user.email} (${user.uid}) and initialized sellers/${effectiveSellerId}`);
} catch (error) {
  console.error(`Error granting seller privileges to ${email}:`, error instanceof Error ? error.message : error);
  process.exit(1);
}
