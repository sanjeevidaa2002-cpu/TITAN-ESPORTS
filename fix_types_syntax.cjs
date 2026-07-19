const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

// The issue is:
// joinedNicknames: {[uid: string]: string
// <added stuff>
// }; // UID -> Free Fire Nickname mapping

content = content.replace(
  /joinedNicknames: \{\[uid: string\]: string\s+gameName\?: string; \/\/ e\.g\. "Free Fire"\s+category\?: "BR" \| "CS" \| string; \/\/ Battle Royale \(BR\) or Clash Squad \(CS\)\s+matchType\?: "Solo" \| "Duo" \| "Squad" \| string;\s+tournamentName\?: string; \/\/ mapped from title\s+thumbnailUrl\?: string; \/\/ mapped from logoUrl\s+description\?: string;\s+registrationStart\?: string;\s+registrationEnd\?: string;\s+matchDate\?: string;\s+matchTime\?: string;\s+status\?: string;\s+createdAt\?: string \| number;\s+updatedAt\?: string \| number;\s+enabled\?: boolean; \/\/ Enable\/Disable Tournament\s+matchCategory\?: "BR" \| "CS" \| string; \/\/ Battle Royale \(BR\) or Clash Squad \(CS\)\}; \/\/ UID -> Free Fire Nickname mapping/g,
  `joinedNicknames: {[uid: string]: string}; // UID -> Free Fire Nickname mapping
  gameName?: string; // e.g. "Free Fire"
  category?: "BR" | "CS" | string; // Battle Royale (BR) or Clash Squad (CS)
  matchType?: "Solo" | "Duo" | "Squad" | string;
  tournamentName?: string; // mapped from title
  thumbnailUrl?: string; // mapped from logoUrl
  description?: string;
  registrationStart?: string;
  registrationEnd?: string;
  matchDate?: string;
  matchTime?: string;
  status?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  enabled?: boolean; // Enable/Disable Tournament
  matchCategory?: "BR" | "CS" | string; // Battle Royale (BR) or Clash Squad (CS)`
);

fs.writeFileSync('src/types.ts', content);
