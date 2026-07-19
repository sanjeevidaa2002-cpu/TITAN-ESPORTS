const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// We need to inject the handleSnapshotError
const handleSnapshotCode = `
      const handleSnapshotError = (err: any, context: string) => {
        console.warn(\`\${context} sync error:\`, err);
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
          console.error("Firebase quota exceeded, switching to local fallback mode.");
          setUseLocalFallback(true);
        }
      };
`;

content = content.replace('checkAndSeedDatabase().then((success) => {', 'checkAndSeedDatabase().then((success) => {' + handleSnapshotCode);

// Let's replace the existing error handlers
// For example: `(err) => { console.warn("Tournaments realtime sync failed, falling back:", err); setUseLocalFallback(true); }`
// We can just find all `onSnapshot(` and make sure we have error handlers for all.
// Instead of writing a complex regex, I will just write a function to do it safely.

// It's probably easier to just find the exact lines and replace them.
fs.writeFileSync(filePath, content);
