/// <reference types="vite/client" />
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  setLogLevel
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Silence internal SDK logs early to prevent gRPC connection warnings in logs
setLogLevel('silent');

// Injected config from firebase-applet-config.json
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if provided
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId && (firebaseConfig as any).firestoreDatabaseId !== '(default)' 
  ? (firebaseConfig as any).firestoreDatabaseId 
  : undefined;

console.log("[Firebase] Using Firestore DB ID:", firestoreDbId || "(default)");

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
}, firestoreDbId);
const storage = getStorage(app);

// Silence internal SDK logs to maintain clean logs and handle connectivity fallback beautifully
// setLogLevel('silent'); // Already set at top

const auth = getAuth(app);
// Ensure auth persistence is set to local
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Auth persistence failed:");
});

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { app, auth, db, storage, googleProvider, signOut, signInWithPopup };
