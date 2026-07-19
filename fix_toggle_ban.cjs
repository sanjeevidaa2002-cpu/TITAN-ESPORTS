const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldToggle = `  const toggleBanUser = async (user: UserProfile) => {
    const isCurrentlyBanned = (user as any).isBanned || false;
    const nextBanStatus = !isCurrentlyBanned;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isBanned: nextBanStatus
      });
      addAuditLog(\`\${nextBanStatus ? 'Banned' : 'Unbanned'} user \${user.nickname}\`);
    } catch (err: any) {
      alert("Error toggling ban: " + err.message);
    }
  };`;

const newToggle = `  const toggleBanUser = async (user: UserProfile) => {
    const isCurrentlyBanned = user.accountStatus === 'disabled' || (user as any).isBanned || false;
    const nextBanStatus = !isCurrentlyBanned;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        accountStatus: nextBanStatus ? 'disabled' : 'active',
        isBanned: nextBanStatus // keep for backwards compatibility if needed
      });
      addAuditLog(\`\${nextBanStatus ? 'Disabled' : 'Enabled'} user \${user.nickname}\`);
    } catch (err: any) {
      alert("Error toggling status: " + err.message);
    }
  };`;

content = content.replace(oldToggle, newToggle);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Fixed toggleBanUser');
