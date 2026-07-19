const fs = require('fs');
let content = fs.readFileSync('src/components/CountdownTimer.tsx', 'utf8');

const replacement = `  if (status === 'match_completed' || status === 'completed') {
    return null; // Handled by parent
  }

  if (status === 'match_live' || status === 'live' || !timeLeft) {
    return (
      <div className="bg-[#121a2a]/40 border border-blue-500/20 rounded-2xl p-3.5 space-y-2 text-[10px] font-sans animate-pulse mt-2">
         <p className="font-bold text-white uppercase tracking-wider flex justify-between items-center text-center w-full">
          <span className="flex items-center gap-1 mx-auto text-blue-400">🟢 Room Available / 🔴 Match Live</span>
        </p>
        <p className="text-center text-[9px] text-neutral-400">Waiting for Admin to reveal Room ID & Password...</p>
      </div>
    );
  }`;

content = content.replace(/  if \(status === 'match_completed' \|\| status === 'completed'\) \{[\s\S]*?    \);\n  \}/, replacement);
fs.writeFileSync('src/components/CountdownTimer.tsx', content);
console.log('CountdownTimer updated');
