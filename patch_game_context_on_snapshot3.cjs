const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// List of all unsub variables to process
const unsubs = [
  "unsubBranding",
  "unsubLoadingScreen",
  "unsubSupport",
  "unsubContactWidget",
  "unsubCategories",
  "unsubWeeklyPlayers",
  "unsubWinners",
  "unsubWeeklyLeaderboardConfig",
  "unsubBanners",
  "unsubStorageFiles",
  "unsubPromoSettings",
  "unsubNotificationSettings",
  "unsubStorageSettings"
];

for (const unsub of unsubs) {
  // Find where it's defined: const unsubX = onSnapshot(
  const startIndex = content.indexOf(`const ${unsub} = onSnapshot(`);
  if (startIndex === -1) continue;

  // Find the end of the statement by finding the closing parenthesis that matches the opening one of onSnapshot
  let openParens = 0;
  let currentIndex = content.indexOf('(', startIndex);
  let endIndex = -1;
  let hasErrorHandler = false;

  for (let i = currentIndex; i < content.length; i++) {
    if (content[i] === '(') openParens++;
    else if (content[i] === ')') {
      openParens--;
      if (openParens === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex !== -1) {
    const block = content.substring(startIndex, endIndex + 1);
    
    // Check if it already ends with an error handler. A crude way:
    // If the last thing is a function, we might have an error handler, but it's easier to check if we see `, (err) =>` or similar.
    if (block.match(/,\s*\(\w+\)\s*=>\s*\{[^}]*\}/)) {
       // already has error handler, replace it
       const newBlock = block.replace(/,\s*\(\w+\)\s*=>\s*\{[^}]*\}/, `, (err) => handleSnapshotError(err, "${unsub.replace('unsub', '')}")`);
       content = content.replace(block, newBlock);
    } else {
       // does not have error handler, insert it
       // We want to insert `, (err) => handleSnapshotError(err, "...")` before the final `)`
       // Note that the last argument might be a function body ending with `}`
       
       const lastBraceIndex = block.lastIndexOf('}');
       if (lastBraceIndex !== -1 && lastBraceIndex < endIndex) {
         // Insert it right after the last `}`
         const newBlock = block.substring(0, lastBraceIndex + 1) + `, (err) => handleSnapshotError(err, "${unsub.replace('unsub', '')}")` + block.substring(lastBraceIndex + 1);
         content = content.replace(block, newBlock);
       }
    }
  }
}

// For unsubTournaments, unsubBonusSettings, unsubLeaderboard, unsubNotifications, we already had them or can do manual replace
content = content.replace(
  /,\s*\(err\)\s*=>\s*\{\s*console\.warn\("Tournaments realtime sync failed, falling back:", err\);\s*setUseLocalFallback\(true\);\s*\}/g,
  `, (err) => handleSnapshotError(err, "Tournaments")`
);
content = content.replace(
  /,\s*\(err\)\s*=>\s*\{\s*console\.warn\("Notifications sync error:", err\);\s*setUseLocalFallback\(true\);\s*\}/g,
  `, (err) => handleSnapshotError(err, "Notifications")`
);
content = content.replace(
  /,\s*\(err\)\s*=>\s*\{\s*console\.warn\("Leaderboard sync error:", err\);\s*\}/g,
  `, (err) => handleSnapshotError(err, "Leaderboard")`
);
content = content.replace(
  /,\s*\(err\)\s*=>\s*\{\s*console\.warn\("Bonus settings sync error:", err\);\s*\}/g,
  `, (err) => handleSnapshotError(err, "Bonus")`
);

fs.writeFileSync(filePath, content);
