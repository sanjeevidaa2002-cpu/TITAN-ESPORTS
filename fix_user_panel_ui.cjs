const fs = require('fs');
let content = fs.readFileSync('src/components/MatchesTab.tsx', 'utf8');

const anchor = `        {/* Dropdown Filters (Mode & Fee) */}`;

const addition = `        {/* FF Category Selector */
        (() => {
          const activeCat = categories?.find(c => c.id === selectedCategory);
          const isFreeFire = selectedCategory === 'all' || (activeCat && (activeCat.name.toLowerCase().includes('free fire') || activeCat.id === 'free_fire'));
          
          if (isFreeFire) {
            return (
              <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5 overflow-x-auto gap-1 mb-2">
                <button 
                  onClick={() => setFfCategoryFilter('all')}
                  className={\`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 \${ffCategoryFilter === 'all' ? 'bg-white/10 text-white shadow' : 'text-neutral-400 hover:text-white'}\`}
                >
                  All FF
                </button>
                <button 
                  onClick={() => setFfCategoryFilter('BR')}
                  className={\`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 \${ffCategoryFilter === 'BR' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white'}\`}
                >
                  🎮 Battle Royale (BR)
                </button>
                <button 
                  onClick={() => setFfCategoryFilter('CS')}
                  className={\`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 \${ffCategoryFilter === 'CS' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow' : 'text-neutral-400 hover:text-white'}\`}
                >
                  ⚔️ Clash Squad (CS)
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* Dropdown Filters (Mode & Fee) */}`;

content = content.replace(anchor, addition);

fs.writeFileSync('src/components/MatchesTab.tsx', content);
