const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldCsvUsers = `      csvContent += "UID,Email,Nickname,FreeFireUID,DepositBalance,WinningBalance,BonusBalance,MatchesPlayed,Wins,Kills,JoinedAt\\n";
      dbUsers.forEach(u => {
        csvContent += \`"\${u.uid}","\${u.email}","\${u.nickname}","\${u.freefireUid}",\${u.depositBalance},\${u.winningBalance},\${u.bonusBalance},\${u.totalMatches},\${u.totalWins},\${u.totalKills},"\${u.joinedAt}"\\n\`;
      });`;

const newCsvUsers = `      csvContent += "UID,MobileNumber,Nickname,ReferralCode,DepositBalance,WinningBalance,BonusBalance,MatchesPlayed,Wins,Kills,JoinedAt,AccountStatus\\n";
      dbUsers.forEach(u => {
        csvContent += \`"\${u.uid}","\${u.mobileNumber || ''}","\${u.nickname}","\${u.referralCode || ''}",\${u.depositBalance},\${u.winningBalance},\${u.bonusBalance},\${u.totalMatches},\${u.totalWins},\${u.totalKills},"\${u.joinedAt}","\${u.accountStatus || 'active'}"\\n\`;
      });`;

content = content.replace(oldCsvUsers, newCsvUsers);

// Fix the display text "UIDs, emails, wins, total matches" -> "UIDs, mobiles, wins, total matches"
content = content.replace("UIDs, emails, wins, total matches", "UIDs, mobiles, wins, total matches");

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Fixed CSV Export');
