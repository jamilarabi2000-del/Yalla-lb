import { initializeApp, cert } from 'firebase-admin/app';
import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from './lib/db.mjs';

const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error('Error: SERVICE_ACCOUNT_JSON environment variable is required.');
  process.exit(1);
}

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

try {
  initializeApp({ cert: cert(JSON.parse(serviceAccountJson)) });
} catch (err) {
  console.error('Failed to initialize Firebase Admin SDK.', err);
  process.exit(1);
}

const db = getDb();

async function migrateCoupons() {
  console.log(`Starting coupon migration... ${isDryRun ? '(DRY RUN)' : ''}`);
  
  const discountsSnap = await db.collection('discounts').get();
  let migrated = 0;
  
  const batch = db.batch();
  
  for (const doc of discountsSnap.docs) {
    const data = doc.data();
    if (data.couponCode && data.couponCode.trim() !== '') {
      const discountId = doc.id;
      const normalizedCode = data.couponCode.trim().toUpperCase();
      
      const couponRef = db.collection('coupons').doc(discountId);
      
      if (!isDryRun) {
        batch.set(couponRef, {
          discountId: discountId,
          couponCode: normalizedCode,
          usageCount: 0,
          usedBy: [],
          maxTotalUses: data.maxTotalUses || null,
          maxUsesPerUser: data.maxUsesPerUser || null,
          createdAt: FieldValue.serverTimestamp()
        });
        
        batch.update(doc.ref, {
          couponCode: FieldValue.delete(),
          maxTotalUses: FieldValue.delete(),
          maxUsesPerUser: FieldValue.delete()
        });
      }
      
      console.log(`Migrating coupon ${normalizedCode} from discount ${discountId}`);
      migrated++;
    }
  }
  
  if (!isDryRun && migrated > 0) {
    await batch.commit();
    console.log(`Successfully committed migration for ${migrated} coupons.`);
  } else {
    console.log(`Found ${migrated} coupons to migrate.`);
  }
}

migrateCoupons().catch(console.error);
