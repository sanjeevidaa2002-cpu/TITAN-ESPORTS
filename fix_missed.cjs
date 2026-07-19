const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /console\.warn\("Leaderboard sync error:", err\);/g,
  `console.warn("Leaderboard sync error: Firebase unavailable.");`
);

content = content.replace(
  /console\.warn\("Notifications sync error:", err\);/g,
  `console.warn("Notifications sync error: Firebase unavailable.");`
);

fs.writeFileSync(filePath, content);
