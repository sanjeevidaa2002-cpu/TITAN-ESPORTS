const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const replacement = `                  <div className="space-y-1">
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
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Map Selector</label>`;

content = content.replace(
  `                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Map Selector</label>`,
  replacement
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
