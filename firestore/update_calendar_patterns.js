'use strict';

const admin = require('/Users/ryota/Desktop/sanyu/gomi-server/node_modules/firebase-admin');
const path = require('path');
const { isDeepStrictEqual } = require('util');

const DATA_PROJECT_ID = 'nth-plexus-329507';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || DATA_PROJECT_ID;
const COLLECTION = 'calendarPatterns5';
const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT
  || '/Users/ryota/Desktop/sanyu/gomi-server/nth-plexus-329507-2ac2ce7e216b.json';
const DATA_FILE = path.join(__dirname, 'calendarPatterns5_updated.json');
const DRY_RUN = process.argv.includes('--dry-run');

function loadDesiredDocuments() {
  const payload = require(DATA_FILE);

  if (payload.projectId !== DATA_PROJECT_ID) {
    throw new Error(`projectId mismatch: ${payload.projectId}`);
  }
  if (payload.collection !== COLLECTION) {
    throw new Error(`collection mismatch: ${payload.collection}`);
  }

  const ids = Object.keys(payload.documents).sort((a, b) => Number(a) - Number(b));
  if (ids.join(',') !== '1,2,3,4,5,6,7,8,9') {
    throw new Error(`unexpected document ids: ${ids.join(',')}`);
  }

  for (const id of ids) {
    const document = payload.documents[id];
    if (document.areaId !== id) {
      throw new Error(`areaId mismatch: document ${id}`);
    }
    const type11 = document.patterns.filter((pattern) => pattern.type === 11);
    if (type11.length !== 1) {
      throw new Error(`type 11 must occur exactly once: area ${id}`);
    }
  }

  const area9 = payload.documents['9'].patterns;
  for (const type of [5, 11]) {
    const pattern = area9.find((item) => item.type === type);
    if (!pattern || pattern.youbi !== 4 || pattern.week !== 0 || pattern.hd !== 0) {
      throw new Error(`invalid area 9 pattern: type ${type}`);
    }
  }

  return payload.documents;
}

async function main() {
  const serviceAccount = require(path.resolve(SERVICE_ACCOUNT));
  if (serviceAccount.project_id !== PROJECT_ID) {
    throw new Error(`service account project mismatch: ${serviceAccount.project_id}`);
  }

  const desired = loadDesiredDocuments();
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });
  const db = app.firestore();
  const currentSnapshot = await db.collection(COLLECTION).get();
  const current = new Map(currentSnapshot.docs.map((doc) => [doc.id, doc.data()]));

  const updates = Object.entries(desired)
    .filter(([id, data]) => !isDeepStrictEqual(current.get(id), data));
  const deletions = currentSnapshot.docs
    .filter((doc) => !Object.prototype.hasOwnProperty.call(desired, doc.id));

  console.log(`project: ${PROJECT_ID}`);
  console.log(`collection: ${COLLECTION}`);
  console.log(`updates: ${updates.map(([id]) => id).join(',') || 'none'}`);
  console.log(`deletions: ${deletions.map((doc) => doc.id).join(',') || 'none'}`);

  if (DRY_RUN) {
    console.log('dry-run: no writes performed');
    return;
  }

  if (updates.length === 0 && deletions.length === 0) {
    console.log('already up to date: no writes performed');
    return;
  }

  const batch = db.batch();
  for (const [id, data] of updates) {
    batch.set(db.collection(COLLECTION).doc(id), data);
  }
  for (const doc of deletions) {
    batch.delete(doc.ref);
  }
  await batch.commit();

  const verifiedSnapshot = await db.collection(COLLECTION).get();
  const verified = Object.fromEntries(verifiedSnapshot.docs.map((doc) => [doc.id, doc.data()]));
  if (!isDeepStrictEqual(verified, desired)) {
    throw new Error('verification failed after update');
  }
  console.log('update and verification completed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
