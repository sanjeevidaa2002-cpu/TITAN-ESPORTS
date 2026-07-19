const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/firebase.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the firebaseConfig hardcoded values with environment variables
content = content.replace(
  /const firebaseConfig = \{[\s\S]*?\};/,
  `const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAAUjOz09JI4PX6_PiVey1QTRMPMcol73E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0214369161.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0214369161",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0214369161.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "87360915147",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:87360915147:web:3e7251f42a24fcfe69bd4e"
};`
);

content = content.replace(
  /const firestoreDatabaseId = "ai-studio-22a89eb0-4b83-4567-8432-43908d6700dc";\nconst db = initializeFirestore\(app, \{[\s\S]*?\}, firestoreDatabaseId\);/,
  `const envDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
const firestoreDatabaseId = envDbId !== undefined ? (envDbId === "default" ? undefined : envDbId) : "ai-studio-22a89eb0-4b83-4567-8432-43908d6700dc";

const db = firestoreDatabaseId ? initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
}, firestoreDatabaseId) : getFirestore(app);`
);

fs.writeFileSync(filePath, content);
console.log("Updated firebase.ts to support env variables");
