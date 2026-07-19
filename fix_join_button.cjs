const fs = require('fs');
let content = fs.readFileSync('src/components/TournamentDetailsModal.tsx', 'utf8');

const matchStartedCondition = `const matchStarted = tournament.roomStatus === 'live' || tournament.roomStatus === 'completed' || tournament.matchRoomStatus === 'match_live' || tournament.matchRoomStatus === 'match_completed';`;

content = content.replace(
  /  const isFormValid = \(\) => \{/g,
  `${matchStartedCondition}\n\n  const isFormValid = () => {`
);

content = content.replace(
  /disabled=\{isJoining \|\| showPaymentConfirm \|\| !isFormValid\(\)\}/g,
  `disabled={isJoining || showPaymentConfirm || !isFormValid() || matchStarted}`
);

content = content.replace(
  /<span>Done<\/span>/g,
  `<span>{matchStarted ? 'Match Started - Joins Disabled' : 'Done'}</span>`
);

fs.writeFileSync('src/components/TournamentDetailsModal.tsx', content);
