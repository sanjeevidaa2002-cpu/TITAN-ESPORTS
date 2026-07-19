const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add fields to matchForm interface
content = content.replace(
  /    tournamentType: 'paid' \| 'free';/g,
  `    tournamentType: 'paid' | 'free';\n    enabled: boolean;\n    matchCategory: 'BR' | 'CS';`
);

// Add fields to matchForm initial state
content = content.replace(
  /    tournamentType: 'paid',/g,
  `    tournamentType: 'paid',\n    enabled: true,\n    matchCategory: 'BR',`
);

// Add fields to saveMatchForm
content = content.replace(
  /        tournamentType: matchForm.tournamentType,/g,
  `        tournamentType: matchForm.tournamentType,\n        enabled: matchForm.enabled,\n        matchCategory: matchForm.matchCategory,`
);

// Update openEditMatchForm
content = content.replace(
  /      tournamentType: t.tournamentType \|\| \(t.isFreeMatch \|\| t.entryFee === 0 \? 'free' : 'paid'\),/g,
  `      tournamentType: t.tournamentType || (t.isFreeMatch || t.entryFee === 0 ? 'free' : 'paid'),\n      enabled: t.enabled !== false,\n      matchCategory: (t.matchCategory as 'BR' | 'CS') || 'BR',`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
