const fs = require('fs');
let content = fs.readFileSync('src/context/GameContext.tsx', 'utf8');

content = content.replace(
  /const \[leaderboard, setLeaderboard\] = useState<LeaderboardEntry\[\]>\(MOCK_LEADERBOARD\);/,
  "const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);\n  const [bonusSettings, setBonusSettings] = useState<BonusSettings | null>(null);"
);

fs.writeFileSync('src/context/GameContext.tsx', content);
