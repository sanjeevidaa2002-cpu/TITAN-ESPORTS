const fs = require('fs');

let fbContent = fs.readFileSync('src/firebase.ts', 'utf8');
fbContent = fbContent.replace(
  /const firestoreDatabaseId = "ai-studio-22a89eb0-4b83-4567-8432-43908d6700dc";[\s\S]*?const storage = getStorage\(app\);/,
  `const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
});
const storage = getStorage(app);`
);
fs.writeFileSync('src/firebase.ts', fbContent);

let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(
  /const firestoreDatabaseId = "ai-studio-22a89eb0-4b83-4567-8432-43908d6700dc";[\s\S]*?\/\/ Local memory fallback store/,
  `// Initialize Firebase Client SDK on the server-side to bypass Service Account permission limitations
const fbApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

const db = initializeFirestore(fbApp, {
  ignoreUndefinedProperties: true,
});

// Local memory fallback store`
);
fs.writeFileSync('server.ts', serverContent);

console.log("Database ID removed.");
