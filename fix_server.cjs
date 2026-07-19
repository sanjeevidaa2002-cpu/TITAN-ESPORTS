const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /console\.warn\("Firestore Client SDK inaccessible \(using local fallback configuration store instead\)\. Details:", err\);/g,
  `console.warn("Firestore Client SDK inaccessible (using local fallback configuration store instead).");`
);

content = content.replace(
  /console\.warn\("Firestore inaccessible, returning local settings:", err\);/g,
  `console.warn("Firestore inaccessible, returning local settings.");`
);

fs.writeFileSync(filePath, content);
