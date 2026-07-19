const fs = require('fs');

let fbContent = fs.readFileSync('src/firebase.ts', 'utf8');
fbContent = fbContent.replace(
  /const db = initializeFirestore\(app, \{\s*experimentalForceLongPolling: true,\s*ignoreUndefinedProperties: true,?\s*\}\);/,
  `const firestoreDatabaseId = "ai-studio-22a89eb0-4b83-4567-8432-43908d6700dc";
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
}, firestoreDatabaseId);`
);
fs.writeFileSync('src/firebase.ts', fbContent);

let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(
  /const db = initializeFirestore\(fbApp, \{\s*ignoreUndefinedProperties: true,?\s*\}\);/,
  `const firestoreDatabaseId = "ai-studio-22a89eb0-4b83-4567-8432-43908d6700dc";
const db = initializeFirestore(fbApp, {
  ignoreUndefinedProperties: true,
}, firestoreDatabaseId);`
);
fs.writeFileSync('server.ts', serverContent);

console.log("Database ID added back.");
