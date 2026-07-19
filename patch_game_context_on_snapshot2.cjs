const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /\(err\) => \{\n\s*console\.warn\("Tournaments realtime sync failed, falling back:", err\);\n\s*setUseLocalFallback\(true\);\n\s*\}/g,
  `(err) => handleSnapshotError(err, "Tournaments")`
);

content = content.replace(
  /\(err\) => \{\n\s*console\.warn\("Bonus settings sync error:", err\);\n\s*\}/g,
  `(err) => handleSnapshotError(err, "Bonus")`
);

content = content.replace(
  /\(err\) => \{\n\s*console\.warn\("Leaderboard sync error:", err\);\n\s*\}/g,
  `(err) => handleSnapshotError(err, "Leaderboard")`
);

content = content.replace(
  /\(err\) => \{\n\s*console\.warn\("Notifications sync error:", err\);\n\s*\}/g,
  `(err) => handleSnapshotError(err, "Notifications")`
);

// For ones without an error handler, like branding and categories, we have to inject it before the closing `);` of the onSnapshot block.
// Example:
//      const unsubBranding = onSnapshot(doc(db, 'settings', 'branding'),
//        (docSnap) => {
//          ...
//        }
//      );
// I can do a regex that finds `unsubBranding = onSnapshot(..., \n        (docSnap) => { ... }\n      );` 
// Better yet, I can just use a simple string replace for each block.

fs.writeFileSync(filePath, content);
