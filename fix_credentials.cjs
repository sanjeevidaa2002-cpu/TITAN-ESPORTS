const fs = require('fs');
let content = fs.readFileSync('src/components/TournamentDetailsModal.tsx', 'utf8');

const anchor = `  // Check if credentials are ready (within 15 minutes of start, or live, or completed)
  const showCredentials = isUserJoined && (
    new Date(tournament.dateTime).getTime() - Date.now() <= 15 * 60 * 1000 || 
    tournament.roomStatus === 'live' || 
    tournament.roomStatus === 'completed'
  );`;

const addition = `  // Check if credentials are ready based on matchRoomStatus
  const showCredentials = isUserJoined && (
    tournament.matchRoomStatus === 'room_available' || 
    tournament.matchRoomStatus === 'match_live'
  );`;

content = content.replace(anchor, addition);

const anchor2 = `                    <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {showCredentials ? 'Active' : 'Unlocks 15m before start'}
                    </span>`;
const addition2 = `                    <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {showCredentials ? 'Active' : (tournament.matchRoomStatus === 'coming_soon' || !tournament.matchRoomStatus) ? 'Coming Soon' : 'Closed'}
                    </span>`;

content = content.replace(anchor2, addition2);

const anchor3 = `                      <p className="text-xs font-semibold text-neutral-300 font-mono">
                        Credentials unlock in: <strong className="text-blue-400">{countdown}</strong>
                      </p>`;
const addition3 = `                      <p className="text-xs font-semibold text-neutral-300 font-mono">
                        Please wait. The Admin will reveal Room details when it's time.
                      </p>`;
                      
content = content.replace(anchor3, addition3);

fs.writeFileSync('src/components/TournamentDetailsModal.tsx', content);
