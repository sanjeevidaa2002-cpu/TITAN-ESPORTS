const fs = require('fs');
let content = fs.readFileSync('src/components/MatchesTab.tsx', 'utf8');

const anchor = `<span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gold-500" />
                        {t.mode}
                      </span>`;

const addition = `<span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gold-500" />
                        {t.matchCategory || 'BR'} ({t.mode})
                      </span>`;

content = content.replace(anchor, addition);

fs.writeFileSync('src/components/MatchesTab.tsx', content);
