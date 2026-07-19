const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/firebase.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const firebaseConfig = \{[\s\S]*?\};/,
  `const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDLgYuFSUVqJEEpnQTX2PjS-7yw898MIxE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "storage-manager-7716b.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://storage-manager-7716b-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "storage-manager-7716b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "storage-manager-7716b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "202549700783",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:202549700783:web:57a11aa9a9477268f2cc5a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NFKEXDGEET"
};`
);

fs.writeFileSync(filePath, content);
console.log("Firebase config updated.");
