const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix handleSnapshotError
content = content.replace(
  /console\.warn\(\`\$\{context\} sync error:\`, err\);/g,
  `console.warn(\`\${context} sync error: Firebase unavailable (Quota exceeded or permissions). Switching to local state.\`);`
);

// Fix Registrations error
content = content.replace(
  /console\.warn\("Registrations sync error, using local fallback:", err\);/g,
  `console.warn("Registrations sync error, using local fallback. Firebase unavailable.");`
);

// Fix Transactions error
content = content.replace(
  /console\.warn\("Transactions sync error:", err\)/g,
  `console.warn("Transactions sync error: Firebase unavailable.")`
);

// Fix User profile sync error
content = content.replace(
  /console\.warn\("User profile sync error:", err\);/g,
  `console.warn("User profile sync error: Firebase unavailable.");`
);

fs.writeFileSync(filePath, content);
