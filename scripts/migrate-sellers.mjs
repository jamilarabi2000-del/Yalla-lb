import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function runMigration() {
  const configPath = './firebase-applet-config.json';
  if (!fs.existsSync(configPath)) {
    console.error('Cannot find firebase-applet-config.json');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const projectId = config.projectId;
  
  if (!projectId) {
    console.error('No projectId found in firebase-applet-config.json');
    process.exit(1);
  }

  initializeApp({ projectId });
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  console.log(`Starting migration on project ${projectId} (Dry run: ${isDryRun})`);
  const snapshot = await db.collection('sellers').get();
  
  const PRIVATE_FIELDS = ['accountEmail', 'accountUid', 'commissionPct', 'exactAddress'];
  const migratedAt = new Date().toISOString();
  
  let count = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const privatePart = {};
    const strip = {};
    let needsMigration = false;
    
    for (const field of PRIVATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        needsMigration = true;
        if (data[field] !== undefined) privatePart[field] = data[field];
        strip[field] = FieldValue.delete();
      }
    }
    
    if (needsMigration) {
      console.log(`Migrating seller ${docSnap.id}...`);
      if (!isDryRun) {
        await db.collection('seller_private').doc(docSnap.id).set({...privatePart, migratedAt}, { merge: true });
        await docSnap.ref.update(strip);
      }
      count++;
    }
  }
  
  console.log(`Migration complete. Processed ${count} sellers.`);
  process.exit(0);
}

runMigration().catch(console.error);
