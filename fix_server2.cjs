const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /console\.warn\("Failed to write YouTube config to remote Firestore\. Saved locally in-memory instead\. Details:", err\);/g,
  `console.warn("Failed to write YouTube config to remote Firestore. Saved locally in-memory instead.");`
);

fs.writeFileSync(filePath, content);
