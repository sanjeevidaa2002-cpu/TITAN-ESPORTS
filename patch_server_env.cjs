const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the firebaseConfig hardcoded values with environment variables
content = content.replace(
  /const firebaseConfig = \{[\s\S]*?\};/,
  `const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDLgYuFSUVqJEEpnQTX2PjS-7yw898MIxE",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "storage-manager-7716b.firebaseapp.com",
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://storage-manager-7716b-default-rtdb.firebaseio.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "storage-manager-7716b",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "storage-manager-7716b.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "202549700783",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:202549700783:web:57a11aa9a9477268f2cc5a",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NFKEXDGEET"
};`
);

content = content.replace(
  /const firestoreDatabaseId = "ai-studio-22a89eb0-4b83-4567-8432-43908d6700dc";/,
  `const envDbId = process.env.VITE_FIREBASE_DATABASE_ID;
const firestoreDatabaseId = envDbId !== undefined ? (envDbId === "default" ? undefined : envDbId) : "ai-studio-22a89eb0-4b83-4567-8432-43908d6700dc";`
);

content = content.replace(
  /const db = initializeFirestore\(fbApp, \{[\s\S]*?\}, firestoreDatabaseId\);/,
  `const db = firestoreDatabaseId ? initializeFirestore(fbApp, {
  ignoreUndefinedProperties: true,
}, firestoreDatabaseId) : getFirestore(fbApp);`
);

// We need to add getFirestore import to firebase/firestore in server.ts if not there
if (!content.includes('getFirestore')) {
  content = content.replace(
    /import \{ initializeFirestore,/,
    `import { initializeFirestore, getFirestore,`
  );
}

fs.writeFileSync(filePath, content);
console.log("Updated server.ts to support env variables");
