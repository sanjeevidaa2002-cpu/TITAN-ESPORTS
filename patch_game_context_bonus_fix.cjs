const fs = require('fs');
let content = fs.readFileSync('src/context/GameContext.tsx', 'utf8');

const anchor = `      // Realtime leaderboard listener
      const unsubLeaderboard = onSnapshot(collection(db, 'leaderboard'),`;

const replacement = `      // Realtime bonus listener
      const unsubBonusSettings = onSnapshot(doc(db, 'appSettings', 'bonus'), (docSnap) => {
        if (docSnap.exists()) {
          setBonusSettings(docSnap.data());
        } else {
          setBonusSettings(null);
        }
      }, (err) => {
        console.warn("Bonus settings sync error:", err);
      });

      // Realtime leaderboard listener
      const unsubLeaderboard = onSnapshot(collection(db, 'leaderboard'),`;

content = content.replace(anchor, replacement);
fs.writeFileSync('src/context/GameContext.tsx', content);
