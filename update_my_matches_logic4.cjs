const fs = require('fs');
let content = fs.readFileSync('src/components/MatchesTab.tsx', 'utf8');

const targetOld = `                    {/* Match Room Status Logic */}
                    {(() => {
                      const isPast = new Date(reg.dateTime).getTime() - Date.now() <= 0;
                      const adminStatus = t?.matchRoomStatus;`;

const targetNew = `                    {/* Match Room Status Logic */}
                    {(() => {
                      const adminStatus = t?.matchRoomStatus;`;

content = content.replace(targetOld, targetNew);
fs.writeFileSync('src/components/MatchesTab.tsx', content);
console.log('Removed isPast');
