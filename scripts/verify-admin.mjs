import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error('Error: SERVICE_ACCOUNT_JSON environment variable is required.');
  console.error('Please run with: SERVICE_ACCOUNT_JSON="$(cat serviceAccount.json)" npm run verify-admin -- email@example.com');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (err) {
  console.error('Failed to parse SERVICE_ACCOUNT_JSON as JSON.', err instanceof Error ? err.message : err);
  process.exit(1);
}

const expectedProjectId = 'yalla-lb-2026';
if (serviceAccount.project_id && serviceAccount.project_id !== expectedProjectId) {
  console.error(`Error: Firebase project ID mismatch. Expected '${expectedProjectId}', but service account has '${serviceAccount.project_id}'.`);
  process.exit(1);
}

try {
  initializeApp({ cert: cert(serviceAccount) });
} catch (err) {
  console.error('Failed to initialize Firebase Admin SDK.', err instanceof Error ? err.message : err);
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run verify-admin -- <email>');
  process.exit(1);
}

try {
  const user = await getAuth().getUserByEmail(email);
  const claims = user.customClaims || {};
  const isAdminTrue = claims.admin === true;

  console.log(`Firebase project: ${expectedProjectId}`);
  console.log(`User email: ${user.email}`);
  console.log(`UID: ${user.uid}`);
  console.log(`Email verified: ${user.emailVerified}`);
  console.log(`Custom claims:`, claims);
  console.log(`Admin claim: ${isAdminTrue ? 'TRUE' : 'FALSE'}`);
} catch (error) {
  console.error(`Error verifying admin for ${email}:`, error instanceof Error ? error.message : error);
  process.exit(1);
}
