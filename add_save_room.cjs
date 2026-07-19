const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const saveRoomFunc = `  const saveRoomDetails = async () => {
    if (isEditingMatch === 'new' || !matchForm.id) {
      alert("Please create and publish the tournament first before managing room details.");
      return;
    }
    try {
      const existing = tournaments.find(t => t.id === matchForm.id);
      if (existing) {
        await saveTournamentAdmin({
          ...existing,
          roomID: matchForm.roomID,
          roomPassword: matchForm.roomPassword,
          matchRoomStatus: matchForm.matchRoomStatus,
          lastUpdated: new Date().toISOString()
        });
        alert("Room Details Saved Successfully.");
      }
    } catch (err: any) {
      alert("Error saving room details: " + err.message);
    }
  };

`;

content = content.replace('  const saveMatchForm = async () => {', saveRoomFunc + '  const saveMatchForm = async () => {');
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Added saveRoomDetails');
