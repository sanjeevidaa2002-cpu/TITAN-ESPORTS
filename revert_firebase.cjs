const fs = require('fs');

// Revert src/firebase.ts
let fbContent = fs.readFileSync('src/firebase.ts', 'utf8');
fbContent = fbContent.replace(
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
fs.writeFileSync('src/firebase.ts', fbContent);

// Revert server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(
  /const firebaseConfig = \{[\s\S]*?\};/,
  `const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAAUjOz09JI4PX6_PiVey1QTRMPMcol73E",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0214369161.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0214369161",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0214369161.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "87360915147",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:87360915147:web:3e7251f42a24fcfe69bd4e"
};`
);
fs.writeFileSync('server.ts', serverContent);

console.log("Firebase config reverted.");
