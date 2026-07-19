const fs = require('fs');
let content = fs.readFileSync('src/components/MatchesTab.tsx', 'utf8');

// Replace the pills inside BOTH places
const pillsOld = `        {/* Status Pills */}
        <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5 overflow-x-auto gap-1">
          <button 
            onClick={() => handleStatusChange('all')}
            className={\`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 \${statusFilter === 'all' ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'}\`}
          >
            All Matches
          </button>
          <button 
            onClick={() => handleStatusChange('open')}
            className={\`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 \${statusFilter === 'open' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-blue-400'}\`}
          >
            Upcoming (Open)
          </button>
          <button 
            onClick={() => handleStatusChange('completed')}
            className={\`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 \${statusFilter === 'completed' ? 'bg-green-600 text-white shadow' : 'text-neutral-400 hover:text-green-400'}\`}
          >
            Completed
          </button>
          <button 
            onClick={() => handleStatusChange('my_matches')}
            className={\`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 \${statusFilter === 'my_matches' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400 hover:text-purple-400'}\`}
          >
            My Matches
          </button>
        </div>`;

const pillsNew = `        {/* Status Pills */}
        <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5 overflow-x-auto gap-1">
          <button 
            onClick={() => handleStatusChange('open')}
            className={\`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 \${statusFilter === 'open' || statusFilter === 'all' ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'}\`}
          >
            New Updates
          </button>
          <button 
            onClick={() => handleStatusChange('my_matches')}
            className={\`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 \${statusFilter === 'my_matches' ? 'bg-green-600 text-white shadow' : 'text-neutral-400 hover:text-green-400'}\`}
          >
            🟢 Joined
          </button>
          <button 
            onClick={() => handleStatusChange('completed')}
            className={\`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 \${statusFilter === 'completed' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400 hover:text-purple-400'}\`}
          >
            Completed
          </button>
        </div>`;

// The My Matches one is slightly different
const myMatchesPillsOld = `                    {/* Status Pills */}
          <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5 overflow-x-auto gap-1">
            <button 
              onClick={() => handleStatusChange('all')}
              className="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 text-neutral-400 hover:text-white"
            >
              All Matches
            </button>
            <button 
              onClick={() => handleStatusChange('open')}
              className="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 text-neutral-400 hover:text-blue-400"
            >
              Upcoming (Open)
            </button>
            <button 
              onClick={() => handleStatusChange('completed')}
              className="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 text-neutral-400 hover:text-green-400"
            >
              Completed
            </button>
            <button 
              onClick={() => handleStatusChange('my_matches')}
              className="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 bg-purple-600 text-white shadow font-black"
            >
              My Matches ({myRegistrations.length})
            </button>
          </div>`;

const myMatchesPillsNew = `                    {/* Status Pills */}
          <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5 overflow-x-auto gap-1">
            <button 
              onClick={() => handleStatusChange('open')}
              className="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 text-neutral-400 hover:text-white"
            >
              New Updates
            </button>
            <button 
              onClick={() => handleStatusChange('my_matches')}
              className="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 bg-green-600 text-white shadow font-black"
            >
              🟢 Joined
            </button>
            <button 
              onClick={() => handleStatusChange('completed')}
              className="flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 text-neutral-400 hover:text-purple-400"
            >
              Completed
            </button>
          </div>`;

content = content.replace(pillsOld, pillsNew);
content = content.replace(myMatchesPillsOld, myMatchesPillsNew);

// Add import for CountdownTimer
if (!content.includes('CountdownTimer')) {
  content = content.replace(`import { `, `import { CountdownTimer } from './CountdownTimer';\nimport { `);
}

fs.writeFileSync('src/components/MatchesTab.tsx', content);
console.log('Successfully updated pills in MatchesTab');
