const fs = require('fs');
let content = fs.readFileSync('src/components/MatchesTab.tsx', 'utf8');

const anchor = `{new Date(t.dateTime).toLocaleDateString()} @ {new Date(t.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

const addition = `{t.matchDate ? \`\${new Date(t.matchDate).toLocaleDateString()} @ \${t.matchTime}\` : (t.dateTime ? \`\${new Date(t.dateTime).toLocaleDateString()} @ \${new Date(t.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\` : 'TBA')}`;

content = content.replace(anchor, addition);

fs.writeFileSync('src/components/MatchesTab.tsx', content);
