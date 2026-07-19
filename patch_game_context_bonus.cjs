const fs = require('fs');
let content = fs.readFileSync('src/context/GameContext.tsx', 'utf8');

if (!content.includes('import {') || !content.includes('BonusSettings')) {
  content = content.replace(/import \{ \n  UserProfile,/g, "import { \n  BonusSettings,\n  BonusHistory,\n  UserProfile,");
}

if (!content.includes('bonusSettings: BonusSettings | null;')) {
  content = content.replace(/  leaderboard: LeaderboardEntry\[\];\n  loading: boolean;/g, "  leaderboard: LeaderboardEntry[];\n  bonusSettings: BonusSettings | null;\n  loading: boolean;");
}

if (!content.includes('const [bonusSettings, setBonusSettings] = useState<BonusSettings | null>(null);')) {
  content = content.replace(/  const \[leaderboard, setLeaderboard\] = useState<LeaderboardEntry\[\]>\(\[\]\);/g, "  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);\n  const [bonusSettings, setBonusSettings] = useState<BonusSettings | null>(null);");
}

if (!content.includes('bonusSettings,')) {
  content = content.replace(/    leaderboard,\n    loading,/g, "    leaderboard,\n    bonusSettings,\n    loading,");
}

// Add onSnapshot for bonusSettings in the main useEffect
if (!content.includes('doc(db, \'appSettings\', \'bonus\')')) {
  const useEffectAnchor = `      const unsubLeaderboard = onSnapshot(collection(db, 'leaderboard'), (snapshot) => {`;
  const addition = `      const unsubBonusSettings = onSnapshot(doc(db, 'appSettings', 'bonus'), (docSnap) => {
        if (docSnap.exists()) {
          setBonusSettings(docSnap.data() as BonusSettings);
        } else {
          setBonusSettings(null);
        }
      });
      
      const unsubLeaderboard = onSnapshot(collection(db, 'leaderboard'), (snapshot) => {`;
  content = content.replace(useEffectAnchor, addition);
}

// Ensure unsubscribe is called for bonusSettings
if (!content.includes('unsubBonusSettings();')) {
  const unsubAnchor = `        unsubLeaderboard();`;
  const addition2 = `        unsubBonusSettings();\n        unsubLeaderboard();`;
  content = content.replace(unsubAnchor, addition2);
}

fs.writeFileSync('src/context/GameContext.tsx', content);
