const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const replacement = `                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Match Category (BR/CS)</label>
                    <select
                      value={matchForm.matchCategory}
                      onChange={e => setMatchForm({...matchForm, matchCategory: e.target.value as 'BR' | 'CS'})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="BR">Battle Royale (BR)</option>
                      <option value="CS">Clash Squad (CS)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Game Category</label>`;

content = content.replace(
  `                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Game Category</label>`,
  replacement
);

const modeReplacement = `                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Status Toggle</label>
                    <select
                      value={matchForm.enabled ? 'true' : 'false'}
                      onChange={e => setMatchForm({...matchForm, enabled: e.target.value === 'true'})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="true">Enabled (Active)</option>
                      <option value="false">Disabled (Hidden)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Format (Match Type)</label>`;

content = content.replace(
  `                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Format</label>`,
  modeReplacement
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
