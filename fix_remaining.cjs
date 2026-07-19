const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace registrations sync error
content = content.replace(
  /console\.warn\("Registrations sync error, using local fallback:", err\);/g,
  `console.warn("Registrations sync error, using local fallback:", err);\n      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) setUseLocalFallback(true);`
);

// Replace transactions sync error
content = content.replace(
  /console\.warn\("Transactions sync error:", err\)/g,
  `{ console.warn("Transactions sync error:", err); if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) setUseLocalFallback(true); }`
);

fs.writeFileSync(filePath, content);
